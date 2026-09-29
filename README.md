# FX Sandbox UI

React and TypeScript dashboard for the FX Sandbox API, built with Vite.

## Features

- Simulated FX rates and price charts.
- Buy/sell limit-order entry and cancellation.
- Pending orders, open positions and recent activity.
- Account equity and realised/unrealised P&L.

## Run

Install Node.js 22+ and start the API at http://localhost:5005.

From this repository's root:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite, normally http://localhost:5173.

## API connection

`vite.config.js` proxies `/api` requests to the backend:

```js
server: {
  proxy: {
    '/api': 'http://localhost:5005'
  }
}
```

The UI polls the API approximately every second. Restart Vite after changing its configuration.

## Build

```bash
npm run build
```

Build output is written to `dist/`. When deploying, configure the host to forward `/api` requests to the backend; the Vite development proxy is not included in the production build.

Simulation only. Account data is held by the API and resets when the API restarts.
