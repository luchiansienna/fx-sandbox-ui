import type { Snapshot } from "../models";
import { money, signed } from "../utils/format";
interface AccountSummaryProps {
  state: Snapshot | null;
}

export function AccountSummary({ state }: AccountSummaryProps) {
  return (
    <section className="stats" aria-label="Account overview">
      {[
        ["Account equity", state?.equity],
        ["Unrealised P&L", state?.unrealisedPnl],
        ["Realised P&L", state?.realisedPnl],
        ["Committed exposure", state?.committedExposure],
      ].map(([label, value], i) => (
        <article key={label as string}>
          <p>{label}</p>
          <strong
            className={
              i === 1 || i === 2
                ? Number(value) >= 0
                  ? "positive"
                  : "negative"
                : ""
            }
          >
            {value === undefined
              ? "—"
              : i === 1 || i === 2
                ? signed(Number(value))
                : money(Number(value))}
          </strong>
          <small>
            {i === 0
              ? "Started with $10,000"
              : i === 3
                ? "$10,000 fixed exposure cap"
                : "USD - profit/loss from closed positions"}
          </small>
        </article>
      ))}
    </section>
  );
}
