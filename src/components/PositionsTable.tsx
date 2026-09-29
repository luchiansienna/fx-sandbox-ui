import type { Snapshot } from "../models";
import { price, signed } from "../utils/format";
interface PositionsTableProps {
  state: Snapshot | null;
}

export function PositionsTable({ state }: PositionsTableProps) {
  return (
    <section className="panel">
      <div className="section-title">
        <h2>
          Open positions <b>{state?.positions.length ?? 0}</b>
        </h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pair</th>
              <th>USD / direction</th>
              <th>Average entry</th>
              <th>Spot</th>
              <th>Unrealised USD</th>
            </tr>
          </thead>
          <tbody>
            {state?.positions.map((p) => (
              <tr key={p.pair}>
                <td>{p.pair}</td>
                <td>
                  {Math.abs(p.quantity).toLocaleString()}{" "}
                  <em>{p.quantity > 0 ? "Long" : "Short"}</em>
                </td>
                <td>{price(p.averagePrice)}</td>
                <td>{price(p.spot)}</td>
                <td className={p.unrealisedPnl >= 0 ? "positive" : "negative"}>
                  {signed(p.unrealisedPnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!state?.positions.length && (
          <div className="empty">
            No positions filled.
            <small>
              Filled orders create positions; opposite trades reduce or reverse
              them.
            </small>
          </div>
        )}
      </div>
    </section>
  );
}
