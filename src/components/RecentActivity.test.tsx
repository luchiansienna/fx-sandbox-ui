import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Order } from "../models";
import { OrderSide } from "../constants/orderSide";
import { RecentActivity } from "./RecentActivity";

function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    pair: "USD/EUR",
    side: OrderSide.Buy,
    quantity: 1000,
    limitPrice: 0.88,
    status: "Filled",
    createdAt: "2026-09-29T12:00:00Z",
    fillPrice: 0.875,
    filledAt: "2026-09-29T12:00:01Z",
    ...overrides,
  };
}

describe("RecentActivity", () => {
  it("shows the heading and empty message when there is no activity", () => {
    render(<RecentActivity done={[]} />);

    expect(
      screen.getByRole("heading", { name: "Recent activity" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Fills and cancellations will appear here."),
    ).toBeInTheDocument();
  });

  it("displays a filled order using its execution price", () => {
    const order = createOrder();

    render(<RecentActivity done={[order]} />);

    expect(screen.getByText("Buy USD/EUR")).toBeInTheDocument();

    expect(
      screen.getByText(
        `${order.quantity.toLocaleString()} USD · 0.875000`,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Filled")).toBeInTheDocument();

    // The limit differs from the execution price and should not be shown.
    expect(
      screen.queryByText(
        `${order.quantity.toLocaleString()} USD · 0.880000`,
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Fills and cancellations will appear here."),
    ).not.toBeInTheDocument();
  });

  it("displays a cancelled order using its limit price", () => {
    const order = createOrder({
      side: OrderSide.Sell,
      pair: "USD/GBP",
      quantity: 2500,
      limitPrice: 0.76,
      status: "Cancelled",
      fillPrice: null,
      filledAt: null,
    });

    render(<RecentActivity done={[order]} />);

    expect(screen.getByText("Sell USD/GBP")).toBeInTheDocument();

    expect(
      screen.getByText(
        `${order.quantity.toLocaleString()} USD · 0.760000`,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("renders multiple activities in the order supplied", () => {
    render(
      <RecentActivity
        done={[
          createOrder({
            id: "order-2",
            side: OrderSide.Sell,
            pair: "USD/CHF",
            status: "Cancelled",
            fillPrice: null,
            filledAt: null,
          }),
          createOrder({ id: "order-1" }),
        ]}
      />,
    );

    const titles = screen.getAllByText(
      /^(Buy|Sell) USD\/(EUR|GBP|CHF)$/,
    );

    expect(titles.map((title) => title.textContent)).toEqual([
      "Sell USD/CHF",
      "Buy USD/EUR",
    ]);

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Filled")).toBeInTheDocument();
  });

  it("shows activity when orders arrive after the initial render", () => {
    const { rerender } = render(<RecentActivity done={[]} />);

    rerender(<RecentActivity done={[createOrder()]} />);

    expect(screen.getByText("Buy USD/EUR")).toBeInTheDocument();

    expect(
      screen.queryByText("Fills and cancellations will appear here."),
    ).not.toBeInTheDocument();
  });

  it("restores the empty message when activity is cleared", () => {
    const { rerender } = render(
      <RecentActivity done={[createOrder()]} />,
    );

    rerender(<RecentActivity done={[]} />);

    expect(
      screen.getByText("Fills and cancellations will appear here."),
    ).toBeInTheDocument();

    expect(screen.queryByText("Buy USD/EUR")).not.toBeInTheDocument();
  });
});