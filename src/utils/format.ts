export const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const price = (value: number) => value.toFixed(6);

export const signed = (value: number) => `${value >= 0 ? "+" : "−"}${money(Math.abs(value))}`;
