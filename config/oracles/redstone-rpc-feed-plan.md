# RedStone RPC Feed Operations Plan

## Short Answer

Our dedicated Etherlink RPC can be used to query RedStone feeds, operate monitoring, and run relayer infrastructure. It cannot, by itself, create a trusted production RedStone oracle feed.

An RPC endpoint is chain transport. A RedStone feed also needs a data service, signed price packages, signer-threshold assumptions, an adapter or feed contract, update conditions, funded relayers, monitoring, and a reviewed failure policy.

## What Our RPC Can Do

- Read an existing RedStone push feed with `eth_call`, such as `latestRoundData()` and `decimals()`.
- Submit relayer transactions that update a deployed RedStone adapter or Chainlink-compatible feed contract.
- Support bots that monitor feed freshness, round timestamps, deviation, gas usage, failed updates, and RPC health.
- Provide lower-rate-limit and lower-latency infrastructure than public RPCs for liquidators and oracle operations.

## What Our RPC Does Not Do

- It does not produce RedStone-signed price data.
- It does not authorize RedStone data providers or signer sets.
- It does not define a feed methodology or source quality policy.
- It does not make a new WXTZ/USDC oracle acceptable for a lending market.
- It does not replace RedStone coordination, commercial review, security review, or launch approval.

## Existing Etherlink RedStone Feed Path

Etherlink documentation lists a RedStone XTZ/USD Chainlink-style feed:

- Etherlink Mainnet: `0xe92c00BC72dD12e26E61212c04E8D93aa09624F2`
- Etherlink Shadownet: `0xb9D0073aCb296719C26a8BF156e4b599174fe1d5`

Those addresses are useful for reading XTZ/USD. They do not automatically provide a complete Morpho WXTZ-collateral / USDC-borrow oracle.

For a WXTZ/USDC Morpho market, the oracle must return the value of one collateral asset quoted in the loan asset. A production design still needs:

- A verified WXTZ-to-XTZ assumption and WXTZ contract risk review.
- A verified USDC/USD feed or an explicitly approved USDC equals 1 USD policy with depeg monitoring and borrow-growth controls.
- Decimals normalization from feed units into Morpho's expected oracle scale.
- Stale-price, missing-price, malformed-price, and deviation tests.

## RedStone Push Relayer Requirements

RedStone push feeds store prices on-chain through relayer updates to an adapter/feed contract. If we operate a relayer with our RPC, the operations plan MUST define:

- `RPC_URL`: our dedicated Etherlink RPC endpoint.
- `CHAIN_ID`: Etherlink Mainnet `42793` or Shadownet `127823`.
- `PRIVATE_KEY`: funded relayer key, stored only in secret infrastructure.
- `ADAPTER_CONTRACT_ADDRESS`: reviewed RedStone adapter/feed contract address.
- `DATA_SERVICE_ID`: approved RedStone data service.
- `DATA_FEEDS`: explicit feed IDs or symbols.
- `UNIQUE_SIGNERS_COUNT`: required signer threshold.
- `CACHE_SERVICE_URLS`: approved RedStone cache/gateway endpoints.
- `UPDATE_CONDITIONS`: heartbeat, deviation, or both.
- Gas funding, restart policy, failover, and alerting.

Run multiple independent relayer instances where possible. A single relayer tied to one RPC endpoint is a single point of failure for feed freshness.

## Production Gate

No production market may depend on a self-operated RedStone path until all of the following are complete:

- RedStone feed support is verified from official RedStone or Etherlink sources.
- Data-service ID, signer set, signer threshold, and feed IDs are documented.
- Adapter/feed contract address and owner/admin controls are reviewed.
- Heartbeat, deviation threshold, and staleness threshold are approved by the risk owner.
- Relayer keys, funding, RPC failover, and alerting are configured.
- Tests cover fresh, stale, missing, malformed, and abnormal price paths.
- Liquidation tests use the exact oracle path.
- Commercial/data-rights requirements are confirmed for production use.
- Security review signs off on the adapter and Morpho oracle integration.

## Shadownet Experiment Scope

Shadownet may be used to prove mechanics:

- Read the existing RedStone XTZ/USD Shadownet feed.
- Confirm our RPC returns the expected chain ID.
- Measure feed freshness and round data over time.
- Run a test relayer only against a test adapter/feed contract.

Shadownet tests do not prove production feed quality, production liquidity, signer availability, or mainnet relayer reliability.

## Decision For Initial WXTZ/USDC Market

Use our RPC as production infrastructure, not as proof that the oracle feed is safe.

The initial market plan should treat RedStone XTZ/USD as a candidate input, then combine it with a verified USDC/USD source or an explicitly approved USDC policy. Any custom RedStone feed or self-operated adapter path remains blocked until the production gate above is complete.

## References

- Etherlink price feeds: `https://docs.etherlink.com/tools/price-feeds/`
- RedStone push model: `https://docs.redstone.finance/docs/dapps/redstone-push/`
- RedStone architecture: `https://docs.redstone.finance/docs/architecture/`
