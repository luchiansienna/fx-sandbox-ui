import type { FormEvent } from "react";
import type { Snapshot } from "../models";
import { price } from "../utils/format";
import { CURRENCY_PAIRS, type CurrencyPair } from "../constants/currencyPairs";

interface OrderTicketProps {
  pair: CurrencyPair;
  side: string;
  quantity: string;
  limit: string;
  state: Snapshot | null;
  busy: boolean;
  connected: boolean;
  error: string;
  notice: string;
  setPair: (pair: CurrencyPair) => void;
  setSide: (side: string) => void;
  setQuantity: (quantity: string) => void;
  setLimit: (limit: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function OrderTicket({
  pair,
  side,
  quantity,
  limit,
  state,
  busy,
  connected,
  error,
  notice,
  setPair,
  setSide,
  setQuantity,
  setLimit,
  submit,
}: OrderTicketProps) {
  return (
    <section className="panel ticket">
      <div className="section-title">
        <h2>Place an order</h2>
        <span>LIMIT</span>
      </div>
      <form onSubmit={submit}>
        <label>
          Currency pair
          <select
            value={pair}
            onChange={(event) => {
              const selectedPair = CURRENCY_PAIRS.find(
                (candidate) => candidate === event.target.value,
              );

              if (!selectedPair) return;

              setPair(selectedPair);
              setLimit(state ? price(state.rates[selectedPair]) : "");
            }}
          >
            {CURRENCY_PAIRS.map((currencyPair) => (
              <option key={currencyPair} value={currencyPair}>
                {currencyPair}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Direction</legend>
          <div className="side-buttons">
            {["Buy", "Sell"].map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={side === s}
                className={side === s ? "active" : ""}
                onClick={() => setSide(s)}
              >
                {s} USD
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Quantity · USD
          <input
            type="number"
            min="0.01"
            max="10000"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
        <label>
          Limit · {pair.split("/")[1]} per USD
          <input
            type="number"
            min="0.000001"
            max="100"
            step="0.000001"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
          />
        </label>
        <button
          type="button"
          className="text-button"
          disabled={!state}
          onClick={() => state && setLimit(price(state.rates[pair]))}
        >
          Use current spot
        </button>
        <p className="hint">
          {side === "Buy"
            ? "Buy fills when spot is less or equal than your limit."
            : "Sell fills when spot is higher or equal than your limit."}{" "}
          Execution uses the current spot, including price improvement.
        </p>
        <button className="submit" disabled={busy || !connected}>
          {busy ? "Processing…" : `Place ${side.toLowerCase()} limit →`}
        </button>
        {error && (
          <p role="alert" className="negative">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
      </form>
    </section>
  );
}
