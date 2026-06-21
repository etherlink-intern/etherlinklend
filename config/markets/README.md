# Market Configuration

Market files are drafts until token addresses, decimals, oracle contracts, IRMs, LLTVs, caps, liquidator readiness, and approvals are independently verified. Do not deploy from templates.

## Market Definition

Each Morpho Blue market is an isolated tuple:

- `loanToken`: loan asset that borrowers receive and lenders supply.
- `collateralToken`: collateral asset pledged by borrowers.
- `oracle`: price source used by the market.
- `irm`: interest-rate model.
- `lltv`: liquidation loan-to-value.

If supply caps, borrow caps, or curation controls are implemented outside Morpho Blue core, the market config MUST document where they are enforced and who owns them.

## Market Approval Process

1. Draft: create a config with placeholders and owner/action/date TODOs.
2. Risk review: review asset liquidity, volatility, bridge risk, and exposure caps.
3. Oracle review: verify feed support, decimals, staleness, and failure mode.
4. Security review: review token behavior, fork tests, and market-specific risk.
5. Testnet validation: deploy or simulate on Etherlink Shadownet only.
6. Approved: record risk owner and reviewer sign-off.
7. Deployed: record deployment artifact.
8. Monitored: confirm alerts, liquidator readiness, and first 24-hour watch.

## Recommended Initial Market Policy

- Start with one or very few markets.
- Prefer stable loan assets.
- Prefer highly liquid collateral.
- Avoid exotic assets initially.
- Do not list assets only because they are popular.
- Do not list assets without oracle and liquidation readiness.

## Required Market Review Questions

- What is the asset?
- Is it bridged?
- Is it upgradeable?
- Can it pause, blacklist, rebase, or charge transfer fees?
- Does it have callback behavior?
- What is the available liquidity?
- What oracle will be used?
- What happens if the oracle is stale?
- Who will liquidate unhealthy positions?
- What is the maximum expected exposure?
- What is the risk owner approval path?

## Blocking TODO Format

Use this format for unresolved market facts:

```text
Owner: TODO
Action: TODO
Date: TODO before market approval
```
