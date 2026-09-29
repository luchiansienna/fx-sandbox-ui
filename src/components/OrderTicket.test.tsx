import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Snapshot } from "../models";
import { OrderSide } from "../constants/orderSide";
import { OrderTicket } from "./OrderTicket";

type OrderTicketProps = ComponentProps<typeof OrderTicket>;

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

function renderOrderTicket(overrides: Partial<OrderTicketProps> = {}) {
  const props: OrderTicketProps = {
    pair: "USD/EUR",
    side: OrderSide.Buy,
    quantity: "1000",
    limit: "0.870000",
    state: createSnapshot(),
    busy: false,
    connected: true,
    error: "",
    notice: "",
    setPair: vi.fn(),
    setSide: vi.fn(),
    setQuantity: vi.fn(),
    setLimit: vi.fn(),
    submit: vi.fn<OrderTicketProps["submit"]>(async (event) => {
      event.preventDefault();
    }),
    ...overrides,
  };

  render(<OrderTicket {...props} />);

  return props;
}

describe("OrderTicket", () => {
  it("displays the supplied form values and available currency pairs", () => {
    renderOrderTicket();

    expect(
      screen.getByRole("combobox", { name: "Currency pair" }),
    ).toHaveValue("USD/EUR");

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["USD/EUR", "USD/GBP", "USD/CHF"]);

    expect(
      screen.getByRole("spinbutton", { name: "Quantity · USD" }),
    ).toHaveValue(1000);

    expect(
      screen.getByRole("spinbutton", { name: "Limit · EUR per USD" }),
    ).toHaveValue(0.87);
  });

  it("updates the selected pair and limit using that pair's spot", async () => {
    const user = userEvent.setup();
    const { setPair, setLimit } = renderOrderTicket();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Currency pair" }),
      "USD/GBP",
    );

    expect(setPair).toHaveBeenCalledWith("USD/GBP");
    expect(setLimit).toHaveBeenCalledWith("0.750000");
  });

  it("clears the limit when changing pair without market data", async () => {
    const user = userEvent.setup();
    const { setPair, setLimit } = renderOrderTicket({ state: null });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Currency pair" }),
      "USD/CHF",
    );

    expect(setPair).toHaveBeenCalledWith("USD/CHF");
    expect(setLimit).toHaveBeenCalledWith("");
  });

  it.each([
    {
      side: OrderSide.Buy,
      otherSide: OrderSide.Sell,
      hint: "Buy fills when spot is less than or equal to your limit.",
    },
    {
      side: OrderSide.Sell,
      otherSide: OrderSide.Buy,
      hint: "Sell fills when spot is greater than or equal to your limit.",
    },
  ])(
    "shows the selected $side direction and matching explanation",
    ({ side, otherSide, hint }) => {
      renderOrderTicket({ side });

      expect(
        screen.getByRole("button", { name: `${side} USD` }),
      ).toHaveAttribute("aria-pressed", "true");

      expect(
        screen.getByRole("button", { name: `${otherSide} USD` }),
      ).toHaveAttribute("aria-pressed", "false");

      expect(
        screen.getByText(hint, { exact: false }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: `Place ${side.toLowerCase()} limit →`,
        }),
      ).toBeEnabled();
    },
  );

  it("requests a direction change without submitting the form", async () => {
    const user = userEvent.setup();
    const { setSide, submit } = renderOrderTicket();

    await user.click(screen.getByRole("button", { name: "Sell USD" }));

    expect(setSide).toHaveBeenCalledWith(OrderSide.Sell);
    expect(submit).not.toHaveBeenCalled();
  });

  it("passes the edited quantity to its callback as a string", () => {
    const { setQuantity } = renderOrderTicket();

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Quantity · USD" }),
      { target: { value: "2500" } },
    );

    expect(setQuantity).toHaveBeenCalledWith("2500");
  });

  it("passes the edited limit to its callback as a string", () => {
    const { setLimit } = renderOrderTicket();

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Limit · EUR per USD" }),
      { target: { value: "0.885" } },
    );

    expect(setLimit).toHaveBeenCalledWith("0.885");
  });

  it("uses the current spot for the selected pair without submitting", async () => {
    const user = userEvent.setup();
    const { setLimit, submit } = renderOrderTicket({
      pair: "USD/CHF",
    });

    await user.click(
      screen.getByRole("button", { name: "Use current spot" }),
    );

    expect(setLimit).toHaveBeenCalledWith("0.820000");
    expect(submit).not.toHaveBeenCalled();
  });

  it("disables Use current spot when market data is unavailable", async () => {
    const user = userEvent.setup();
    const { setLimit } = renderOrderTicket({ state: null });

    const button = screen.getByRole("button", {
      name: "Use current spot",
    });

    expect(button).toBeDisabled();

    await user.click(button);

    expect(setLimit).not.toHaveBeenCalled();
  });

  it("submits a valid form", async () => {
    const user = userEvent.setup();
    const { submit } = renderOrderTicket();

    await user.click(
      screen.getByRole("button", { name: "Place buy limit →" }),
    );

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it.each([
    { busy: true, connected: true },
    { busy: false, connected: false },
    { busy: true, connected: false },
  ])(
    "prevents button submission when busy=$busy and connected=$connected",
    async ({ busy, connected }) => {
      const user = userEvent.setup();
      const { submit } = renderOrderTicket({ busy, connected });

      const button = screen.getByRole("button", {
        name: busy ? "Processing…" : "Place buy limit →",
      });

      expect(button).toBeDisabled();

      await user.click(button);

      expect(submit).not.toHaveBeenCalled();
    },
  );

  it("displays an error as an alert", () => {
    renderOrderTicket({
      error: "Order exceeds the exposure limit.",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Order exceeds the exposure limit.",
    );
  });

  it("displays a notice as a status message", () => {
    renderOrderTicket({
      notice: "Order placed successfully.",
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Order placed successfully.",
    );
  });

  it("hides feedback elements when there are no messages", () => {
    renderOrderTicket();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});