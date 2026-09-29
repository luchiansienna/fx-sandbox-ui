import { useTradingSandbox } from "./hooks/useTradingSandbox";
import { Header } from "./components/Header";
import { Intro } from "./components/Intro";
import { ConnectionNotice } from "./components/ConnectionNotice";
import { AccountSummary } from "./components/AccountSummary";
import { MarketWatch } from "./components/MarketWatch";
import { OrderBook } from "./components/OrderBook";
import { PositionsTable } from "./components/PositionsTable";
import { OrderTicket } from "./components/OrderTicket";
import { RecentActivity } from "./components/RecentActivity";
import { Footer } from "./components/Footer";

export default function App() {
  const trading = useTradingSandbox();

  return (
    <main>
      <Header connected={trading.connected} />
      <Intro />
      <ConnectionNotice connected={trading.connected} />
      <AccountSummary state={trading.state} />

      <div className="workspace">
        <div className="market">
          <MarketWatch
            history={trading.history}
            pair={trading.pair}
            state={trading.state}
            setPair={trading.setPair}
            setLimit={trading.setLimit}
          />
          <OrderBook
            pending={trading.pending}
            busy={trading.busy}
            connected={trading.connected}
            cancel={trading.cancel}
          />
          <PositionsTable state={trading.state} />
        </div>

        <aside>
          <OrderTicket
            pair={trading.pair}
            side={trading.side}
            quantity={trading.quantity}
            limit={trading.limit}
            state={trading.state}
            busy={trading.busy}
            connected={trading.connected}
            error={trading.error}
            notice={trading.notice}
            setPair={trading.setPair}
            setSide={trading.setSide}
            setQuantity={trading.setQuantity}
            setLimit={trading.setLimit}
            submit={trading.submit}
          />
          <RecentActivity done={trading.done} />
        </aside>
      </div>

      <Footer />
    </main>
  );
}
