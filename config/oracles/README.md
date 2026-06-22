# Oracle Configuration

No production oracle adapter is implemented in this scaffold. Every feed ID/address, heartbeat, deviation threshold, staleness threshold, and decimals normalization path must be verified from official oracle documentation before market creation.

## Oracle Role In Morpho Markets

Each market depends on correct pricing. Oracle mistakes can cause immediate bad debt, unfair liquidations, blocked liquidations, or incorrect borrowing power.

The oracle for a market MUST be reviewed separately from the loan asset, collateral asset, IRM, and LLTV.

## Planned Oracle Sources

Pyth and RedStone are candidates for Etherlink. Do not assume a feed exists until it is verified against official oracle sources and tested on Etherlink Shadownet.

Each feed MUST be mapped per asset pair. The mapping MUST include feed ID or adapter address, decimals, staleness policy, update model, and failure behavior.

Dedicated RPC infrastructure is useful for querying feeds, monitoring them, and running RedStone relayers. It does not itself create a trusted RedStone feed. See [RedStone RPC Feed Operations Plan](redstone-rpc-feed-plan.md).

The repository also includes a config-driven price-source monitor for XTZ/USD, USDC/USD, and WXTZ/USDC. See [Etherlink Price Source Monitor](../../docs/oracle-price-monitor.md) and [`etherlink-price-sources.json`](etherlink-price-sources.json).

## Oracle Requirements

Every production market oracle MUST have:

- Correct asset pair.
- Correct decimals.
- Staleness threshold.
- Fail-closed behavior.
- Deviation and heartbeat assumptions.
- Test coverage.
- Monitoring.
- Liquidation-path tests using the oracle.

## Forbidden Oracle Practices

- No thin DEX spot-only oracle for production lending.
- No unverified feed IDs.
- No feed with unclear decimals.
- No silent stale-price fallback.
- No hardcoded USDC equals 1 USD production fallback.
- No assumption that owning an RPC endpoint is enough to create or approve a production oracle feed.
- No market deployment before stale-price behavior is tested.

## Blocking TODOs

- Owner: TODO oracle reviewer. Action: verify Pyth and/or RedStone support for intended initial assets. Date: TODO before market draft approval.
- Owner: TODO protocol engineer. Action: define oracle normalization tests per market. Date: TODO before Shadownet market creation.
