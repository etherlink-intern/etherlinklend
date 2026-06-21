# Pyth / RedStone Planning Notes

## Pyth Notes

- Pyth commonly uses a pull-based update model.
- Integration MUST account for price-update flow and freshness.
- Feed IDs MUST be verified per asset.
- Integration tests MUST cover fresh, stale, missing, and abnormal prices.
- Any price-update keeper or relayer requirement MUST be documented before launch.

## RedStone Notes

- RedStone may use a push or adapter model depending on integration.
- Adapter address and supported feeds MUST be verified against official sources.
- Freshness, signer, and data-package assumptions MUST be documented.
- Integration tests MUST cover stale, missing, and malformed price paths.
- Our dedicated RPC can support RedStone reads and relayer transactions, but it is not a data source, signer set, or feed methodology. See [RedStone RPC Feed Operations Plan](redstone-rpc-feed-plan.md).

## Open Questions

- Owner: TODO oracle reviewer. Action: select oracle per initial market. Date: TODO before market approval.
- Owner: TODO operations lead. Action: decide who operates price-update infrastructure if needed. Date: TODO before Shadownet deployment.
- Owner: TODO operations lead. Action: define RedStone relayer/RPC ownership, failover, funding, and alerting if a RedStone push path is used. Date: TODO before market approval.
- Owner: TODO risk owner. Action: define stale-price threshold per market. Date: TODO before market approval.
- Owner: TODO monitoring owner. Action: define stale and abnormal price alerts. Date: TODO before market visibility.
- Owner: TODO protocol engineer. Action: define behavior if oracle fails during volatile markets. Date: TODO before external audit.

## Market Oracle Checklist

- [ ] Feed verified.
- [ ] Decimals verified.
- [ ] Staleness tested.
- [ ] Failure mode tested.
- [ ] Liquidation with oracle tested.
- [ ] Monitoring configured.

## Fallback Policy

No fallback is approved by default. A fallback policy MUST be reviewed explicitly, because a bad fallback can be worse than a fail-closed oracle.
