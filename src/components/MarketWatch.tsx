import type { Snapshot } from "../models";
import { price } from "../utils/format";
import { CURRENCY_PAIRS } from "../constants/currencyPairs";
import type { CurrencyPair } from "../constants/currencyPairs";

interface MarketWatchProps {
  history: Record<string, number[]>;
  pair: CurrencyPair;
  state: Snapshot | null;
  setPair: (pair: CurrencyPair) => void;
  setLimit: (limit: string) => void;
}

export function MarketWatch({
  history,
  pair,
  state,
  setPair,
  setLimit,
}: MarketWatchProps) {
  return (
    <section className="panel">
      <div className="section-title">
        <h2>Market watch</h2>
        <span>1 SECOND TICKS</span>
      </div>
      <div className="quotes">
        {CURRENCY_PAIRS.map((p) => {
          const samples = history[p] ?? [];
          const first = samples[0] ?? 0;
          const last = samples.at(-1) ?? 0;
          const change = first ? (last / first - 1) * 100 : 0;
          const lo = Math.min(...samples),
            hi = Math.max(...samples);
          const points = samples
            .map(
              (v, i) =>
                `${(i * 260) / Math.max(samples.length - 1, 1)},${48 - ((v - lo) / (hi - lo || 1)) * 40}`,
            )
            .join(" ");
          return (
            <button
              className={`quote ${pair === p ? "selected" : ""}`}
              key={p}
              onClick={() => {
                setPair(p);
                setLimit(state ? price(state.rates[p]) : "");
              }}
            >
              <span>
                {p}
                <small>{p.split("/")[1]} PER USD</small>
              </span>
              <strong>{state ? price(state.rates[p]) : "—"}</strong>
              <svg viewBox="0 0 260 55" aria-hidden="true">
                <polyline
                  points={points}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <small className={change >= 0 ? "positive" : "negative"}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(3)}% <span>observed window</span>
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
