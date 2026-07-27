# Risk Framework

## Risk Principle

Initial markets must be conservative. Isolated markets limit blast radius, but they do not eliminate loss risk.

Every market MUST have a risk owner. The risk owner approves the loan asset, collateral asset, oracle, IRM, LLTV, caps if applicable, liquidation assumptions, and monitoring thresholds.

## Risk Dimensions

Review each market for:

- Asset liquidity.
- Volatility.
- Oracle quality.
- Bridge risk.
- Token behavior.
- Smart contract risk.
- Liquidation depth.
- Borrow demand.
- Correlation between loan and collateral assets.
- Expected maximum exposure.

## Initial Launch Restrictions

Initial launch SHOULD NOT include:

- Long-tail collateral.
- Rebasing tokens.
- Fee-on-transfer tokens.
- Tokens with unclear decimals or transfer behavior.
- Unverified oracles.
- Markets without liquidation testing.
- Complex bridged assets without specific review.

## Parameter Review

Market parameter review MUST cover:

- LLTV.
- Supply cap.
- Borrow cap.
- IRM.
- Liquidation assumptions.
- Monitoring thresholds.
- Exposure ramp-up plan.

## Review Cadence

Risk review MUST occur:

- Pre-launch.
- After testnet.
- After the first mainnet week.
- After material market changes.
- After upstream dependency changes.
- After oracle incidents.
- After any high or critical incident.

## Completed Asset Reviews

| Asset | Role | Review | Status |
|---|---|---|---|
| WXTZ | Collateral candidate | [wxtz-due-diligence.md](wxtz-due-diligence.md) | Technical review complete; **not approved** pending risk-owner decisions |
| USDC (bridged) | Loan asset candidate | [usdc-due-diligence.md](usdc-due-diligence.md) | Technical review complete; **not approved** pending risk-owner decisions |
| WXTZ/USDC market | First market candidate | [wxtz-usdc-market-risk-memo.md](wxtz-usdc-market-risk-memo.md) | Parameter proposal; **awaiting risk-owner decision**. Draft config: [etherlink-mainnet-wxtz-usdc.json](../markets/etherlink-mainnet-wxtz-usdc.json) |

Cross-cutting findings from those reviews that bind the first market:

- Executable WXTZ → USDC depth collapses between 30,000 and 40,000 WXTZ
  (~$6,200–$8,300). Above that, slippage exceeds any plausible liquidation
  incentive and the position cannot be cleared profitably. **This caps the
  size of the entire first market.**
- A single 2-of-3 Gnosis Safe is the trust root for *both* assets: it owns
  WXTZ and owns the bridge that mints USDC. Isolated markets do not mitigate a
  dependency shared inside one market.
- The Etherlink "USDC" is bridge-minted, not Circle-native. No pause, no
  blacklist, no cap on bridge minting.
- **Caps are not enforceable.** Morpho Blue core has no supply or borrow cap,
  and ADR 0003 excludes the vault layer that would provide one. Every cap in
  the market config is an advisory monitoring threshold; anyone can supply or
  borrow past it. See Finding 0 in the market risk memo — the risk owner
  should treat this as the primary launch decision, ahead of LLTV and caps.

## Blocking TODOs

- Owner: TODO risk owner. Action: define first market candidates and reject list. Date: TODO before Shadownet market config.
- Owner: TODO security reviewer. Action: define minimum invariant tests for low-fee dust loops. Date: TODO before external audit.
