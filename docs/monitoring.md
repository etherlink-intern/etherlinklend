# Monitoring Plan

## Required Alerts

- Oracle stale price.
- Oracle abnormal price movement.
- Bad debt or near-bad-debt conditions.
- High utilization.
- Failed liquidations.
- Liquidation opportunities.
- Abnormal event volume.
- RPC/indexer failure.
- RedStone relayer failure, if a RedStone push path is operated by the team.
- Deployment artifact mismatch.

## Required Dashboards

- Per-market supply and borrow.
- Per-market collateral and debt.
- Utilization.
- Oracle freshness.
- Oracle relayer update age and failed update count, if applicable.
- Liquidation opportunities.
- Liquidator status.
- Error rates for indexer/RPC.

## Blocking TODOs

- Owner: TODO monitoring owner. Action: select monitoring stack. Date: TODO before Shadownet deployment.
- Owner: TODO operations lead. Action: assign first 24-hour watch. Date: TODO before mainnet launch.
