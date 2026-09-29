import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Snapshot, Order } from "../models";
import { request } from "../api/request";
import { price } from "../utils/format";
import { CURRENCY_PAIRS, type CurrencyPair } from "../constants/currencyPairs";
import { OrderSide } from "../constants/orderSide";
import { OrderStatus } from "../constants/orderStatus";

export function useTradingSandbox() {
  const previousOrderStatuses = useRef<Map<string, string>>(new Map());
  const notificationSessionId = useRef<string | null>(null);
  const [state, setState] = useState<Snapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pair, setPair] = useState<CurrencyPair>(CURRENCY_PAIRS[0]);
  const [side, setSide] = useState<OrderSide>(OrderSide.Buy);
  const [quantity, setQuantity] = useState("1000");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const lastVersion = useRef(-1);
  const sessionId = useRef("");
  function accept(next: Snapshot) {
    // Do not let a slower request overwrite a newer trading snapshot.
    const newSession = sessionId.current !== next.sessionId;

    if (newSession) {
      sessionId.current = next.sessionId;
      lastVersion.current = -1;
    }
    if (next.version < lastVersion.current) {
      return;
    }

    notifyFilledOrders(next);
    setState(next);

    if (next.version > lastVersion.current) {
      lastVersion.current = next.version;

      setHistory((previous) =>
        Object.fromEntries(
          Object.entries(next.rates).map(([pair, rate]) => [
            pair,
            [...(newSession ? [] : (previous[pair] ?? [])), rate].slice(-90),
          ]),
        ),
      );
    }
  }
  function notifyFilledOrders(next: Snapshot) {
    // Establish a baseline on first connection or after an API restart.
    if (notificationSessionId.current !== next.sessionId) {
      notificationSessionId.current = next.sessionId;
      previousOrderStatuses.current = new Map(
        next.orders.map((order) => [order.id, order.status]),
      );
      return;
    }

    const filledOrders = next.orders.filter(
      (order) =>
        order.status === OrderStatus.Filled &&
        previousOrderStatuses.current.get(order.id) === OrderStatus.Open,
    );

    previousOrderStatuses.current = new Map(
      next.orders.map((order) => [order.id, order.status]),
    );

    if (filledOrders.length === 1) {
      const order = filledOrders[0];

      setNotice(
        `${order.side} ${order.pair} filled${
          order.fillPrice != null ? ` at ${price(order.fillPrice)}` : ""
        }.`,
      );
    } else if (filledOrders.length > 1) {
      setNotice(`${filledOrders.length} limit orders filled.`);
    }
  }

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const next = await request<Snapshot>("/api/state");
        if (active) {
          accept(next);
          setConnected(true);
        }
      } catch {
        if (active) setConnected(false);
      } finally {
        if (active) timer = setTimeout(poll, 1000);
      }
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => {
      setNotice("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (state && !limit) setLimit(price(state.rates[pair]));
  }, [state, pair, limit]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const order = await request<Order>("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair,
          side,
          quantity: Number(quantity),
          limitPrice: Number(limit),
        }),
      });
      setNotice(
        order.status === OrderStatus.Filled
          ? `Order filled at ${price(order.fillPrice!)}.`
          : "Limit order placed. Waiting for spot to reach your price.",
      );
      accept(await request<Snapshot>("/api/state"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to place order.");
    } finally {
      setBusy(false);
    }
  }
  async function cancel(id: string) {
    setBusy(true);
    setError("");
    try {
      await request<void>(`/api/orders/${id}`, { method: "DELETE" });
      accept(await request<Snapshot>("/api/state"));
      setNotice("Order cancelled.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to cancel.");
    } finally {
      setBusy(false);
    }
  }
  const pending = state?.orders.filter((o) => o.status === OrderStatus.Open) ?? [];
  const done =
    state?.orders
      .filter((o) => o.status !== OrderStatus.Open)
      .slice(-12)
      .reverse() ?? [];

  return {
    state,
    connected,
    error,
    notice,
    pair,
    side,
    quantity,
    limit,
    busy,
    history,
    pending,
    done,
    setPair,
    setSide,
    setQuantity,
    setLimit,
    submit,
    cancel,
  };
}
