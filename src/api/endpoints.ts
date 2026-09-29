const API_BASE_PATH = "/api";
const ORDERS_PATH = `${API_BASE_PATH}/orders`;

export const API_ENDPOINTS = {
  state: `${API_BASE_PATH}/state`,
  orders: ORDERS_PATH,
  order: (id: string) => `${ORDERS_PATH}/${encodeURIComponent(id)}`,
} as const;