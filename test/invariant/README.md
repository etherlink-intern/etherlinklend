# Future Invariants

- Total supply accounting should not lose value through rounding loops.
- Borrow shares/assets conversions must be monotonic under repeated dust operations.
- Liquidation paths must not create bad debt through rounding.
- Oracle stale price handling must revert or fail closed.
- No market creation should allow zero address oracle/IRM/collateral/loan tokens unless upstream explicitly permits and it is documented.
- Repeated tiny operations must be tested because low transaction costs on Etherlink make dust/rounding exploitation more practical.

## Shadownet Rounding/Dust Plan

Future Shadownet-focused invariant tests must cover:

- Repeated tiny supply/withdraw loops.
- Repeated tiny borrow/repay loops.
- Share/assets conversion monotonicity.
- Oracle price rounding boundaries.
- Liquidation with dust debt.
- Liquidation with dust collateral.
- Bad debt boundary cases.
- Zero and near-zero liquidity conditions.

Because Etherlink fees are low, fuzz settings should include high-iteration dust cases. Start with 10,000-iteration bounded loops in local tests, then increase only when runtime remains acceptable.
