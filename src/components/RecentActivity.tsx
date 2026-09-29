import type { Order } from "../models";
import { price } from "../utils/format";
interface RecentActivityProps {
  done: Order[];
}

export function RecentActivity({ done }: RecentActivityProps) {
  return (
    <section className="panel activity">
      <div className="section-title">
        <h2>Recent activity</h2>
      </div>
      {done.length ? (
        done.map((o) => (
          <div className="event" key={o.id}>
            <span className="event-dot" />
            <div>
              <strong>
                {o.side} {o.pair}
              </strong>
              <small>
                {o.quantity.toLocaleString()} USD ·{" "}
                {o.fillPrice ? price(o.fillPrice) : price(o.limitPrice)}
              </small>
            </div>
            <span>{o.status}</span>
          </div>
        ))
      ) : (
        <p className="hint">Fills and cancellations will appear here.</p>
      )}
    </section>
  );
}
