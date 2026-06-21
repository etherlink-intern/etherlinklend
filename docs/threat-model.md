# Threat Model

Primary risks include oracle manipulation/staleness, wrong decimals, non-standard ERC20 behavior, fee-on-transfer/rebasing/callback tokens, rounding/dust attacks, liquidation failure, bad debt, admin/deployer key compromise, misconfigured markets, low-liquidity collateral, bridge/wrapped asset risk, and chain/RPC/indexer reliability. Etherlink-specific review must include gas pricing, RPC behavior, explorer verification, and low-fee dust attack economics.
