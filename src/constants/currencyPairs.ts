export const CURRENCY_PAIRS = [
  "USD/EUR",
  "USD/GBP",
  "USD/CHF",
] as const;

export type CurrencyPair = (typeof CURRENCY_PAIRS)[number];