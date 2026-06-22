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

## Blocking TODOs

- Owner: TODO risk owner. Action: define first market candidates and reject list. Date: TODO before Shadownet market config.
- Owner: TODO security reviewer. Action: define minimum invariant tests for low-fee dust loops. Date: TODO before external audit.
