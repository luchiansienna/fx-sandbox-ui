import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Snapshot } from "../models";
import { MarketWatch } from "./MarketWatch";

type Props = ComponentProps<typeof MarketWatch>;

function createSnapshot(): Snapshot {
  return {
    sessionId: "test-session",
    version: 1,
    timestamp: "2026-09-29T12:00:00Z",
    rates: {
      "USD/EUR": 0.876543,
      "USD/GBP": 0.75,
      "USD/CHF": 0.82,
    },
    orders: [],
    positions: [],
    balance: 10_000,
    equity: 10_000,
    realisedPnl: 0,
    unrealisedPnl: 0,
    committedExposure: 0,
    exposureLimit: 10_000,
  };
}

function renderMarketWatch(overrides: Partial<Props> = {}) {
  const props: Props = {
    history: {},
    pair: "USD/EUR",
    state: createSnapshot(),
    setPair: vi.fn(),
    setLimit: vi.fn(),
    ...overrides,
  };

  render(<MarketWatch {...props} />);

  return props;
}

describe("MarketWatch", () => {
  it("renders all three pairs with rates formatted to six decimals", () => {
    renderMarketWatch();

    expect(screen.getAllByRole("button")).toHaveLength(3);

    const eur = screen.getByRole("button", { name: /USD\/EUR/ });
    const gbp = screen.getByRole("button", { name: /USD\/GBP/ });
    const chf = screen.getByRole("button", { name: /USD\/CHF/ });

    expect(within(eur).getByText("0.876543")).toBeInTheDocument();
    expect(within(gbp).getByText("0.750000")).toBeInTheDocument();
    expect(within(chf).getByText("0.820000")).toBeInTheDocument();
  });

  it("highlights the selected pair", () => {
    renderMarketWatch({ pair: "USD/GBP" });

    expect(
      screen.getByRole("button", { name: /USD\/GBP/ }),
    ).toHaveClass("selected");

    expect(
      screen.getByRole("button", { name: /USD\/EUR/ }),
    ).not.toHaveClass("selected");

    expect(
      screen.getByRole("button", { name: /USD\/CHF/ }),
    ).not.toHaveClass("selected");
  });

  it("selects a clicked pair and sets its current spot as the limit", async () => {
    const user = userEvent.setup();
    const { setPair, setLimit } = renderMarketWatch();

    await user.click(
      screen.getByRole("button", { name: /USD\/GBP/ }),
    );

    expect(setPair).toHaveBeenCalledExactlyOnceWith("USD/GBP");
    expect(setLimit).toHaveBeenCalledExactlyOnceWith("0.750000");
  });

  it("shows placeholders before account data arrives", () => {
    renderMarketWatch({ state: null });

    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("allows pair selection without data and clears the limit", async () => {
    const user = userEvent.setup();

    const { setPair, setLimit } = renderMarketWatch({
      state: null,
    });

    await user.click(
      screen.getByRole("button", { name: /USD\/CHF/ }),
    );

    expect(setPair).toHaveBeenCalledWith("USD/CHF");
    expect(setLimit).toHaveBeenCalledWith("");
  });

  it.each([
    {
      samples: [1, 1.01],
      expected: "+1.000%",
      colour: "positive",
    },
    {
      samples: [1, 0.99],
      expected: "-1.000%",
      colour: "negative",
    },
    {
      samples: [1, 1],
      expected: "+0.000%",
      colour: "positive",
    },
    {
      samples: [1],
      expected: "+0.000%",
      colour: "positive",
    },
    {
      samples: [],
      expected: "+0.000%",
      colour: "positive",
    },
  ])(
    "shows $expected for history $samples",
    ({ samples, expected, colour }) => {
      renderMarketWatch({
        history: { "USD/EUR": samples },
      });

      const card = screen.getByRole("button", {
        name: /USD\/EUR/,
      });

      const change = within(card).getByText(
        (_, element) =>
          element?.tagName === "SMALL" &&
          element.textContent?.startsWith(expected) === true,
      );

      expect(change).toHaveClass(colour);
      expect(change).toHaveTextContent(expected);
    },
  );
});