# Future Invariants

- Total supply accounting should not lose value through rounding loops.
- Borrow shares/assets conversions must be monotonic under repeated dust operations.
- Liquidation paths must not create bad debt through rounding.
- Oracle stale price handling must revert or fail closed.
- No market creation should allow zero address oracle/IRM/collateral/loan tokens unless upstream explicitly permits and it is documented.
- Repeated tiny operations must be tested because low transaction costs on Etherlink make dust/rounding exploitation more practical.
