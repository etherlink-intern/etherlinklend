# ADR 0001: Use Morpho Blue Isolated Markets

## Status

Accepted for initial implementation.

## Decision

Use Morpho Blue isolated markets as the initial architecture for the Etherlink Morpho deployment.

Each market is a separate loan asset, collateral asset, oracle, IRM, and LLTV tuple with its own risk owner, oracle review, liquidation plan, and monitoring configuration.

## Alternatives Considered

- Compound III / Comet.
- Aave V3 Origin.
- Euler V2 / EVK.
- Old Compound V2 forks.
- Old or stale Aave forks.
- Superlend fork.
- Aave-style pooled lending as the first product.

## Rationale

Isolated markets provide clearer blast-radius control, simpler launch sequencing, and market-by-market risk ownership. This is a better initial fit for Etherlink than launching a pooled lending market with broader cross-asset contagion risk.

## Consequences

- Better per-market isolation.
- More curation responsibility.
- Need market-by-market risk review.
- Need oracle review per market.
- Need liquidation readiness per market.
- Vault or allocator layers, if added later, need separate review.

## Verification TODO

- Owner: TODO protocol engineer.
- Action: review this ADR after first Shadownet market test.
- Date: TODO before mainnet approval.
