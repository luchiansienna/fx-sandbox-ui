import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Order } from "../models";
import { OrderSide } from "../constants/orderSide";
import { OrderBook } from "./OrderBook";

type OrderBookProps = ComponentProps<typeof OrderBook>;

function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    pair: "USD/EUR",
    side: OrderSide.Buy,
    quantity: 1000,
    limitPrice: 0.875,
    status: "Open",
    createdAt: "2026-09-29T12:00:00Z",
    fillPrice: null,
    filledAt: null,
    ...overrides,
  };
}

function renderOrderBook(overrides: Partial<OrderBookProps> = {}) {
  const props: OrderBookProps = {
    pending: [],
    busy: false,
    connected: true,
    cancel: vi.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined),
    ...overrides,
  };

  render(<OrderBook {...props} />);

  return props;
}

describe("OrderBook", () => {
  it("shows the empty message when there are no pending orders", () => {
    renderOrderBook();

    expect(
      screen.getByRole("heading", { name: "Order book 0" }),
    ).toBeInTheDocument();

    expect(screen.getByText("No resting orders.")).toBeInTheDocument();

    expect(
      screen.getByText(
        "Pending limit orders will appear here until filled or cancelled.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });

  it("displays the order details and formatted limit price", () => {
    const order = createOrder();
    renderOrderBook({ pending: [order] });

    // The first row contains the column headings.
    const row = screen.getAllByRole("row")[1];
    const cells = within(row).getAllByRole("cell");

    expect(cells[0]).toHaveTextContent("USD/EUR");
    expect(cells[0]).toHaveTextContent("Buy");
    expect(cells[1]).toHaveTextContent(order.quantity.toLocaleString());
    expect(cells[2]).toHaveTextContent("0.875000");
    expect(cells[3]).toHaveTextContent("Open");

    expect(
      within(row).getByRole("button", { name: "Cancel" }),
    ).toBeEnabled();

    expect(screen.queryByText("No resting orders.")).not.toBeInTheDocument();
  });

  it("shows the number of pending orders", () => {
    renderOrderBook({
      pending: [
        createOrder(),
        createOrder({
          id: "order-2",
          pair: "USD/GBP",
          side: OrderSide.Sell,
        }),
      ],
    });

    expect(
      screen.getByRole("heading", { name: "Order book 2" }),
    ).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(2);
  });

  it.each([
    { side: OrderSide.Buy, expectedClass: "positive" },
    { side: OrderSide.Sell, expectedClass: "negative" },
  ])("styles $side orders as $expectedClass", ({ side, expectedClass }) => {
    renderOrderBook({
      pending: [createOrder({ side })],
    });

    expect(screen.getByText(side)).toHaveClass(expectedClass);
  });

  it("calls cancel with the ID of the selected order", async () => {
    const user = userEvent.setup();

    const { cancel } = renderOrderBook({
      pending: [
        createOrder({ id: "order-1" }),
        createOrder({
          id: "order-2",
          pair: "USD/GBP",
          side: OrderSide.Sell,
        }),
      ],
    });

    const secondOrderRow = screen.getByRole("row", {
      name: /USD\/GBP/,
    });

    await user.click(
      within(secondOrderRow).getByRole("button", { name: "Cancel" }),
    );

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith("order-2");
  });

  it.each([
    { busy: true, connected: true },
    { busy: false, connected: false },
    { busy: true, connected: false },
  ])(
    "prevents cancellation when busy=$busy and connected=$connected",
    async ({ busy, connected }) => {
      const user = userEvent.setup();

      const { cancel } = renderOrderBook({
        pending: [createOrder()],
        busy,
        connected,
      });

      const button = screen.getByRole("button", { name: "Cancel" });

      expect(button).toBeDisabled();

      await user.click(button);

      expect(cancel).not.toHaveBeenCalled();
    },
  );
});