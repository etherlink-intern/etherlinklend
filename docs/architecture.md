# Architecture Decision

## Decision Summary

Selected architecture: Morpho Blue-based isolated lending markets on Etherlink.

The Etherlink Morpho deployment will treat each market as a separate loan asset, collateral asset, oracle, IRM, and LLTV configuration. Each market is a separate risk container and MUST have its own market review, oracle review, liquidation plan, monitoring plan, and risk owner approval.

Not selected for initial launch:

- Old Compound V2 forks.
- Old Aave forks.
- Stale Aave V3 forks.
- Superlend fork.
- Aave-style pooled lending as the first product.

This document records the initial architecture decision. It does not approve deployment.

## Why Morpho Blue

Morpho Blue was selected as the preferred base architecture because:

- It supports isolated markets.
- The primitive is minimized and easier to reason about than a large pooled market.
- Risk can be contained and reviewed per market.
- A vault or curation layer MAY be added later without making pooled lending the first launch surface.
- It fits a cautious Etherlink launch that starts with one or very few conservative markets.

Upstream Morpho Blue maturity does not automatically make this deployment safe. The Etherlink Morpho deployment has its own fork/deployment risk, market-configuration risk, oracle risk, liquidation risk, and chain-specific risk.

## Market Model

Each market MUST define:

- Loan asset: the asset borrowers receive and lenders supply.
- Collateral asset: the asset pledged by borrowers.
- Oracle: the price source used by the market.
- IRM: the interest-rate model.
- LLTV: liquidation loan-to-value.
- Caps: supply/borrow caps if implemented in periphery, vaults, curation controls, or off-chain launch controls.
- Curator or risk owner: person or committee accountable for approving the market.
- Monitoring configuration: alerts for oracle staleness, utilization, bad debt, liquidation opportunities, abnormal events, and RPC/indexer failures.
- Liquidation readiness: tested route, liquidator operator, RPC access, expected slippage, and failure handling.

Market creation MUST NOT proceed while token addresses, token decimals, oracle addresses/feed IDs, oracle decimals, IRM address, LLTV, and liquidation path remain placeholders.

## Initial Launch Philosophy

The initial launch SHOULD use one or very few markets. The first markets SHOULD use conservative assets only.

Initial markets SHOULD prefer:

- Highly liquid, standard ERC-20 assets.
- Simple loan asset and collateral asset behavior.
- Clear oracle support.
- Tested liquidation routes.
- Conservative LLTV and caps.

Initial markets SHOULD avoid:

- Exotic collateral.
- Fee-on-transfer tokens.
- Rebasing tokens.
- ERC-777 or ERC-677 callback tokens.
- Thin LP tokens.
- Complex bridged assets unless specifically reviewed.
- Assets with unclear decimals, pause behavior, blacklist behavior, upgradeability, or transfer hooks.

## Why Not Aave-Style Pooled Lending First

Aave-style pooled lending is not the first implementation target because:

- Cross-asset contagion can make one bad asset affect the broader pool.
- Governance and configuration surface is larger.
- A pooled design has more moving parts for a new Etherlink deployment.
- Market onboarding can become harder to reason about if risk is shared across assets.
- A prior Etherlink lending deployment reportedly used an Aave V3-style fork and suffered a rounding-related incident affecting BTC markets.

That reported incident is not treated as a complete technical conclusion. The actual postmortem MUST be collected and summarized before launch.

## Why Not Old Compound/Aave Forks

Old Compound and Aave forks are not selected because:

- Abandoned forks can miss upstream patches.
- Fork deployers often introduce configuration, oracle, decimal, or deployment mistakes.
- Battle testing does not transfer automatically to a new chain, asset list, oracle stack, deployment script, or liquidation setup.
- Older forks can increase audit burden without giving clear isolation benefits.

## Future Extensions

Future extensions MAY include:

- MetaMorpho-style vaults or a curated vault layer.
- Public allocator or rebalancing layer.
- Additional oracle adapters.
- Frontend.
- Liquidation bots.
- Monitoring and indexing.
- Governance or risk committee process.

Each extension MUST have a separate design review and security review before production use.

## Non-Goals

- No production deployment in this repo-population task.
- No protocol logic changes in this task.
- No new oracle adapters without separate audit.
- No permissionless production market creation until risk controls are designed.
- No claim that immutable contracts can be patched after deployment unless the specific deployed component is upgradeable.
