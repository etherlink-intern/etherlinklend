# Threat Model

## Scope

This threat model covers:

- Morpho Blue core integration and upstream assumptions.
- Fork and deployment scripts.
- Market configuration.
- Oracles.
- Token behavior.
- Liquidations.
- Monitoring and indexing.
- Etherlink chain-specific assumptions.

It separates upstream protocol risk from fork/deployment risk, market-configuration risk, oracle risk, token risk, liquidation risk, and chain-specific risk.

## Major Risk Categories

### Oracle Manipulation

Incorrect, manipulable, or low-liquidity price sources can cause immediate bad debt or unfair liquidations. Production markets MUST NOT rely on thin DEX spot-only pricing.

### Oracle Staleness

Stale prices can allow undercollateralized borrowing or prevent necessary liquidations. Each market MUST define stale-price thresholds and fail-closed behavior.

### Wrong Decimals

Wrong token or oracle decimals can scale collateral or debt incorrectly. Token decimals, oracle decimals, and Morpho oracle quote assumptions MUST be verified independently.

### Wrong Price Scaling

Price scaling mistakes can be equivalent to listing an asset at the wrong price. Integration tests MUST cover expected price normalization for each market.

### Rounding and Dust Loops

Rounding behavior can become exploitable when repeated many times. Etherlink's low fees make high-iteration dust loops practical and MUST be tested aggressively.

### Share/Accounting Precision Loss

Share-to-asset and asset-to-share conversions MUST be tested for monotonicity, dust behavior, and loss of accounting precision across repeated operations.

### Repeated Tiny Operations

Deposits, withdrawals, borrows, repays, liquidations, and interest accrual SHOULD be fuzzed with repeated tiny values and high iteration counts.

### Low-Liquidity Collateral

Low-liquidity collateral can make liquidations impossible at the assumed price. Market approval MUST include liquidation-depth analysis.

### Bad Debt

Bad debt can arise from oracle errors, overly high LLTV, liquidation failure, token behavior surprises, or liquidity gaps. Monitoring MUST alert on bad debt and near-bad-debt conditions.

### Liquidation Failure

Liquidation can fail because of oracle issues, token transfer behavior, insufficient liquidator capital, RPC failures, or market illiquidity. Liquidation paths MUST be tested before deployment.

### Liquidator Downtime

Markets MUST NOT assume a single liquidator will always be online. The launch plan SHOULD define operators, RPC failover, alerting, and fallback procedures.

### IRM Misconfiguration

An inappropriate IRM can create unhealthy utilization, borrower stress, or lender losses. IRM selection MUST be reviewed per market.

### LLTV Too High

Overly aggressive LLTV can turn normal volatility into bad debt. Initial LLTV SHOULD be conservative.

### Supply/Borrow Caps Missing or Too High

If caps are implemented in periphery, curation controls, or vaults, they MUST be reviewed. Missing or excessive caps can make a configuration mistake too large to contain.

### Non-Standard ERC-20 Behavior

Non-standard return values, transfer restrictions, or balance behavior can break assumptions. Token behavior MUST be reviewed before market approval.

### Fee-on-Transfer Tokens

Fee-on-transfer tokens SHOULD be excluded from initial markets unless specifically supported, tested, and audited.

### Rebasing Tokens

Rebasing tokens SHOULD be excluded from initial markets unless the accounting impact is specifically supported, tested, and audited.

### ERC-777/ERC-677 Callbacks

Callback-capable tokens can introduce reentrancy or unexpected control flow. Such tokens SHOULD be excluded from initial markets.

### Pausable/Blacklistable Tokens

Pausable or blacklistable tokens can block liquidations, repayments, or withdrawals. If considered, their admin and failure modes MUST be documented.

### Bridge/Wrapped Asset Risk

Wrapped or bridged assets introduce bridge, custodian, and liquidity risk. This project does not claim to solve all bridge risk.

### RPC/Indexer Failures

Public RPC or indexer failures can blind monitors and liquidators. Production operations MUST use dedicated RPC, alerting, and failover planning.

### Admin/Deployer Key Compromise

Deployment keys, multisig signers, and any admin controls MUST be documented and secured. Private keys MUST NOT be committed.

### Frontend/Address-Poisoning Risk

Users can be harmed by spoofed markets, poisoned addresses, or stale frontend metadata. Frontend and indexer controls MUST be reviewed before launch.

## Etherlink-Specific Risk Emphasis

Etherlink's low transaction costs mean repeated exploit loops are cheaper. Rounding, dust, griefing, and repeated-operation cases MUST be tested with high iteration counts.

Public RPCs may be insufficient for bots, monitoring, and liquidators. Liquidation infrastructure MUST be tested under realistic congestion and RPC failure assumptions.

Gas-cost-based attack deterrence MUST NOT be assumed.

## Superlend Lesson

A prior Etherlink lending deployment reportedly suffered a rounding-related incident affecting BTC markets. This project is not forking Superlend and MUST NOT rely on fork lineage as a safety guarantee.

The Etherlink Morpho deployment MUST explicitly test rounding, dust, and repeated-operation invariants. The actual postmortem SHOULD be collected and summarized in `audits/upstream/` or `docs/incidents/` before launch.

TODO:

- Owner: TODO security reviewer.
- Action: collect primary Superlend incident report, wind-down notes, and technical postmortem if available.
- Date: TODO before external audit.

## Required Mitigations

- Conservative initial markets.
- External audit.
- Oracle review.
- Token due diligence.
- Invariant tests.
- Fork tests.
- Liquidation dry runs.
- Monitoring and alerting.
- Emergency response rehearsal.

## Out of Scope

- This project does not claim to solve all bridge risk.
- This project does not insure users.
- This project does not claim immutable contracts can be patched after deployment unless the specific component is upgradeable.
- This document does not approve any production deployment.
