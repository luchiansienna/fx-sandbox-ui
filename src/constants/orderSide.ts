export enum OrderSide {
  Buy = "Buy",
  Sell = "Sell",
}

export const ORDER_SIDES = [OrderSide.Buy, OrderSide.Sell] as const;