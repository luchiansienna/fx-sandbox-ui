import { CurrencyPair } from "./constants/currencyPairs";
import { OrderSide } from "./constants/orderSide";

export type Order = {
  id: string;
  pair: CurrencyPair;
  side: OrderSide;
  quantity: number;
  limitPrice: number;
  status: string;
  fillPrice: number | null;
};
export type Position = {
  pair: string;
  quantity: number;
  averagePrice: number;
  spot: number;
  unrealisedPnl: number;
};
export type Snapshot = {
  sessionId: string;
  version: number;
  timestamp: string;
  rates: Record<string, number>;
  orders: Order[];
  positions: Position[];
  balance: number;
  equity: number;
  realisedPnl: number;
  unrealisedPnl: number;
  committedExposure: number;
  exposureLimit: number;
};