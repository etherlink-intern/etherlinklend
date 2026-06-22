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
- Required price-source monitor failure for WXTZ/USDC.
- Required DEX executable route failure or large route deviation.
- USDC/USD depeg deviation across oracle, CEX, and indexer sources.

## Required Dashboards

- Per-market supply and borrow.
- Per-market collateral and debt.
- Utilization.
- Oracle freshness.
- Oracle relayer update age and failed update count, if applicable.
- Liquidation opportunities.
- Liquidator status.
- Error rates for indexer/RPC.
- NOC price-source table for XTZ/USD, USDC/USD, and WXTZ/USDC.
- DEX route health, output amount, and deviation from the derived WXTZ/USDC reference.

## Price Source Monitor

The WXTZ/USDC launch path requires a config-driven price-source monitor before a market is approved. See [Etherlink Price Source Monitor](oracle-price-monitor.md).

The monitor MUST:

- Refresh upstream price sources no more frequently than every 15 minutes by default.
- Read source definitions from config instead of hardcoding feed IDs, token addresses, endpoints, or prices in application code.
- Avoid any production hardcoded USDC equals 1 USD fallback.
- Include at least one CEX source for XTZ and USDC monitoring.
- Treat DEX route monitoring as essential for launch readiness and circuit-breaker decisions.
- Show per-source prices, reference prices, source class, source status, and deviations in basis points.
- Expose a simple JSON-RPC endpoint that future product services can consume.

## Blocking TODOs

- Owner: TODO monitoring owner. Action: select monitoring stack. Date: TODO before Shadownet deployment.
- Owner: TODO operations lead. Action: assign first 24-hour watch. Date: TODO before mainnet launch.
