# Etherlink Price Source Monitor

This repository includes a small NOC-style price monitor for the first WXTZ/USDC lending-market primitive. It is not a production oracle contract. It is an operations endpoint that reads configured sources, computes a reference price, and shows deviations between sources.

The monitor is intentionally config-driven. Feed IDs, contract addresses, token addresses, API endpoints, stale thresholds, and required-source flags live in [`config/oracles/etherlink-price-sources.json`](../config/oracles/etherlink-price-sources.json). The runtime does not hardcode a USDC equals 1 USD price.

## Source Model

The current source set is:

| Pair | Source | Class | Role |
|---|---|---|---|
| XTZ/USD | RedStone Etherlink XTZ/USD push feed | Oracle | On-chain oracle input |
| XTZ/USD | Pyth Hermes XTZ/USD | Oracle | Oracle cross-check |
| XTZ/USD | Binance XTZ/USDT | CEX | CEX monitor |
| XTZ/USD | CoinGecko WXTZ token price | Indexer | Off-chain indexer monitor |
| USDC/USD | Pyth Hermes USDC/USD | Oracle | Oracle input |
| USDC/USD | Binance USDC/USDT | CEX | CEX monitor |
| USDC/USD | CoinGecko USDC token price | Indexer | Off-chain indexer monitor |
| USDC/USD | Etherlink Blockscout USDC exchange rate | Indexer | Explorer/indexer monitor |
| WXTZ/USDC | Kyber executable WXTZ to USDC route | DEX executable | Essential DEX monitor |

DEX monitoring is required because lending risk depends on executable liquidity, slippage, and depeg behavior. The DEX route is not used alone as the lending reference price. It is compared against the derived WXTZ/USDC reference so deviations can drive caps, alerts, or circuit breakers.

## Reference Policy

The monitor calculates:

- `XTZ/USD`: median of healthy oracle, CEX, and indexer sources.
- `USDC/USD`: median of healthy oracle, CEX, and indexer sources.
- `WXTZ/USDC`: derived from `XTZ/USD / USDC/USD`.

Each source row receives a signed `deviationBps` and absolute `absDeviationBps` against its pair reference. The default thresholds are:

- Warning: `100` bps.
- Critical: `250` bps.

The monitor marks required source failures as `degraded`.

## Refresh Cadence

The JSON-RPC server caches a snapshot for `900` seconds by default. This keeps v0 simple and avoids unnecessary rate-limit pressure on Binance, CoinGecko, Pyth Hermes, Blockscout, and Kyber.

Override only when needed:

```bash
ORACLE_MONITOR_REFRESH_SECONDS=900 pnpm oracle:serve
```

## Commands

Print one JSON snapshot:

```bash
pnpm oracle:prices
```

Print a terminal table:

```bash
pnpm oracle:prices:table
```

Start the JSON-RPC endpoint:

```bash
pnpm oracle:serve
```

Defaults:

- Host: `127.0.0.1`
- Port: `8789`
- Config: `config/oracles/etherlink-price-sources.json`

Use a dedicated Etherlink RPC for on-chain RedStone reads:

```bash
ETHERLINK_MAINNET_RPC_URL=https://your-rpc.example pnpm oracle:serve
```

## JSON-RPC Methods

Discover methods:

```bash
curl -s http://127.0.0.1:8789 \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"rpc.discover","params":{}}'
```

Get the source config:

```bash
curl -s http://127.0.0.1:8789 \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"oracle.sources","params":{}}'
```

Get the full snapshot:

```bash
curl -s http://127.0.0.1:8789 \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"oracle.snapshot","params":{}}'
```

Get the NOC table:

```bash
curl -s http://127.0.0.1:8789 \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"oracle.table","params":{}}'
```

For manual operations only, pass `{"force":true}` to bypass the cache and refresh sources immediately.

## Lending Integration Path

The lending product should treat this endpoint as an input primitive, not as final oracle authority:

1. Read `oracle.table` or `oracle.snapshot`.
2. Require fresh oracle rows for `XTZ/USD` and `USDC/USD`.
3. Require the essential DEX route to be healthy.
4. Reject collateral pricing if required sources fail or DEX deviation crosses the approved threshold.
5. Feed approved prices into a reviewed on-chain oracle adapter only after stale-price, decimals, fail-closed, and liquidation tests pass.

This gives the team an observable pathway to a safer collateral price without hardcoding USDC or relying on one thin DEX spot price.
