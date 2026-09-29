import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Snapshot } from "../models";
import { signed } from "../utils/format";
import { PositionsTable } from "./PositionsTable";

type Position = Snapshot["positions"][number];

function createPosition(overrides: Partial<Position> = {}): Position {
  return {
    pair: "USD/EUR",
    quantity: 1000,
    averagePrice: 0.875,
    spot: 0.88,
    unrealisedPnl: 5.68,
    ...overrides,
  };
}

function createSnapshot(positions: Position[] = []): Snapshot {
  return {
    sessionId: "test-session",
    version: 1,
    timestamp: "2026-09-29T12:00:00Z",
    rates: {
      "USD/EUR": 0.88,
      "USD/GBP": 0.75,
      "USD/CHF": 0.82,
    },
    orders: [],
    positions,
    balance: 10_000,
    equity: 10_000 + positions.reduce(
      (total, position) => total + position.unrealisedPnl,
      0,
    ),
    realisedPnl: 0,
    unrealisedPnl: positions.reduce(
      (total, position) => total + position.unrealisedPnl,
      0,
    ),
    committedExposure: positions.reduce(
      (total, position) => total + Math.abs(position.quantity),
      0,
    ),
    exposureLimit: 10_000,
  };
}

describe("PositionsTable", () => {
  it.each([
    { description: "market data is unavailable", state: null },
    { description: "there are no positions", state: createSnapshot() },
  ])("shows the empty state when $description", ({ state }) => {
    render(<PositionsTable state={state} />);

    expect(
      screen.getByRole("heading", { name: "Open positions 0" }),
    ).toBeInTheDocument();

    expect(screen.getByText("No positions filled.")).toBeInTheDocument();

    expect(
      screen.getByText(
        "Filled orders create positions; opposite trades reduce or reverse them.",
      ),
    ).toBeInTheDocument();

    // Only the table header remains.
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("displays the position's pair, size, entry price, spot and P&L", () => {
    const position = createPosition();

    render(
      <PositionsTable state={createSnapshot([position])} />,
    );

    const row = screen.getByRole("row", { name: /USD\/EUR/ });
    const cells = within(row).getAllByRole("cell");

    expect(cells[0]).toHaveTextContent("USD/EUR");
    expect(cells[1]).toHaveTextContent(
      `${position.quantity.toLocaleString()} Long`,
    );
    expect(cells[2]).toHaveTextContent("0.875000");
    expect(cells[3]).toHaveTextContent("0.880000");
    expect(cells[4]).toHaveTextContent(signed(position.unrealisedPnl));

    expect(
      screen.queryByText("No positions filled."),
    ).not.toBeInTheDocument();
  });

  it.each([
    { quantity: 1500, direction: "Long" },
    { quantity: -1500, direction: "Short" },
  ])(
    "displays quantity $quantity as an absolute size with $direction direction",
    ({ quantity, direction }) => {
      render(
        <PositionsTable
          state={createSnapshot([createPosition({ quantity })])}
        />,
      );

      const row = screen.getByRole("row", { name: /USD\/EUR/ });
      const sizeCell = within(row).getAllByRole("cell")[1];

      expect(sizeCell).toHaveTextContent(
        `${Math.abs(quantity).toLocaleString()} ${direction}`,
      );
      expect(sizeCell).not.toHaveTextContent("-");
    },
  );

  it.each([
    { pnl: 12.5, expectedClass: "positive", otherClass: "negative" },
    { pnl: -8.25, expectedClass: "negative", otherClass: "positive" },
    { pnl: 0, expectedClass: "positive", otherClass: "negative" },
  ])(
    "formats P&L $pnl and applies the $expectedClass style",
    ({ pnl, expectedClass, otherClass }) => {
      render(
        <PositionsTable
          state={createSnapshot([
            createPosition({ unrealisedPnl: pnl }),
          ])}
        />,
      );

      const row = screen.getByRole("row", { name: /USD\/EUR/ });
      const pnlCell = within(row).getAllByRole("cell")[4];

      expect(pnlCell).toHaveTextContent(signed(pnl));
      expect(pnlCell).toHaveClass(expectedClass);
      expect(pnlCell).not.toHaveClass(otherClass);
    },
  );

  it("shows the position count and a row for each pair", () => {
    render(
      <PositionsTable
        state={createSnapshot([
          createPosition(),
          createPosition({
            pair: "USD/GBP",
            quantity: -2000,
            averagePrice: 0.76,
            spot: 0.75,
            unrealisedPnl: 26.67,
          }),
        ])}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Open positions 2" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("row", { name: /USD\/EUR/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("row", { name: /USD\/GBP/ }),
    ).toBeInTheDocument();

    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("updates the spot and P&L when a new snapshot arrives", () => {
    const { rerender } = render(
      <PositionsTable
        state={createSnapshot([createPosition()])}
      />,
    );

    rerender(
      <PositionsTable
        state={createSnapshot([
          createPosition({
            spot: 0.87,
            unrealisedPnl: -5.75,
          }),
        ])}
      />,
    );

    const row = screen.getByRole("row", { name: /USD\/EUR/ });
    const cells = within(row).getAllByRole("cell");

    expect(cells[3]).toHaveTextContent("0.870000");
    expect(cells[4]).toHaveTextContent(signed(-5.75));
    expect(cells[4]).toHaveClass("negative");
    expect(cells[4]).not.toHaveClass("positive");
  });

  it("shows the empty state after the last position closes", () => {
    const { rerender } = render(
      <PositionsTable
        state={createSnapshot([createPosition()])}
      />,
    );

    rerender(<PositionsTable state={createSnapshot()} />);

    expect(
      screen.getByRole("heading", { name: "Open positions 0" }),
    ).toBeInTheDocument();

    expect(screen.getByText("No positions filled.")).toBeInTheDocument();

    expect(
      screen.queryByRole("row", { name: /USD\/EUR/ }),
    ).not.toBeInTheDocument();
  });
});