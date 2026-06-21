# Pyth / RedStone Planning Notes

- Planned oracle source per asset: TODO per market.
- Price feed ID/address placeholders: `TODO_VERIFIED_FEED_ID`, `TODO_VERIFIED_ADAPTER_ADDRESS`.
- Staleness thresholds: TODO based on asset volatility and oracle SLA.
- Decimals normalization: TODO verify token decimals, feed decimals, and Morpho oracle expected quote format.
- Heartbeat/deviation assumptions: TODO from official Pyth/RedStone docs.
- Fallback policy: no fallback until reviewed; avoid silent stale fallback.
- Fail-closed behavior: oracle reads must revert or produce unusable output on stale/missing data.
