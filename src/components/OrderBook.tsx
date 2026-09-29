import type { Order } from "../models";
import { price } from "../utils/format";
import { OrderSide } from "../constants/orderSide";

interface OrderBookProps {
  pending: Order[];
  busy: boolean;
  connected: boolean;
  cancel: (id: string) => Promise<void>;
}

export function OrderBook({
  pending,
  busy,
  connected,
  cancel,
}: OrderBookProps) {
  return (
    <section className="panel">
      <div className="section-title">
        <h2>
          Order book <b>{pending.length}</b>
        </h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pair / side</th>
              <th>Size (USD)</th>
              <th>Limit</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pending.map((o) => (
              <tr key={o.id}>
                <td>
                  {o.pair}{" "}
                  <em className={o.side === OrderSide.Buy ? "positive" : "negative"}>
                    {o.side}
                  </em>
                </td>
                <td>{o.quantity.toLocaleString()}</td>
                <td>{price(o.limitPrice)}</td>
                <td>
                  <span className="pill">Open</span>
                </td>
                <td>
                  <button
                    className="text-button"
                    disabled={busy || !connected}
                    onClick={() => void cancel(o.id)}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!pending.length && (
          <div className="empty">
            No resting orders.
            <small>
              Pending limit orders will appear here until filled or cancelled.
            </small>
          </div>
        )}
      </div>
    </section>
  );
}
