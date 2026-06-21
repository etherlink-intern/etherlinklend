# Liquidation Bot Planning

## Requirements

Each approved market MUST have liquidation readiness before user-facing launch.

Liquidation readiness includes:

- Liquidation route.
- Liquidator operator.
- Dedicated RPC.
- Oracle freshness checks.
- Slippage assumptions.
- Capital source.
- Failure alerts.
- Fork-test coverage.
- Shadownet dry run.

## Testing

Liquidation tests SHOULD cover:

- Normal liquidation.
- Oracle stale or reverting.
- Thin liquidity.
- High slippage.
- RPC failure.
- Repeated small position liquidation.
- Paused or restricted token behavior where relevant.

## Blocking TODOs

- Owner: TODO operations lead. Action: design liquidation bot architecture. Date: TODO before Shadownet market creation.
- Owner: TODO risk owner. Action: approve market-specific liquidation assumptions. Date: TODO before market approval.
