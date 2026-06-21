# Launch Checklist

Any unchecked launch-blocking item prevents mainnet deployment.

## Upstream And Licensing

- [ ] Upstream SHAs pinned.
- [ ] Licenses reviewed.
- [ ] NOTICE updated.
- [ ] Legal review complete.

## Build And Tests

- [ ] Clean build.
- [ ] Unit tests passing.
- [ ] Fork tests passing.
- [ ] Fuzz tests passing.
- [ ] Invariant tests passing.
- [ ] Gas snapshot reviewed.

## Security Review

- [ ] Static analysis complete.
- [ ] Fork diff reviewed.
- [ ] External audit complete.
- [ ] No unresolved criticals.
- [ ] No unresolved highs.
- [ ] Medium findings accepted or fixed.
- [ ] Security contact active.

## Oracle Readiness

- [ ] Oracle source selected.
- [ ] Feed exists.
- [ ] Feed decimals verified.
- [ ] Staleness policy defined.
- [ ] Failure mode tested.
- [ ] Fallback policy defined or explicitly rejected.
- [ ] RedStone RPC/relayer plan reviewed, if RedStone is used.
- [ ] RedStone data-service ID, signer threshold, adapter/feed address, and update conditions documented, if RedStone is used.

## Market Readiness

- [ ] Loan asset reviewed.
- [ ] Collateral asset reviewed.
- [ ] Token decimals verified.
- [ ] Token behavior reviewed.
- [ ] Liquidity reviewed.
- [ ] LLTV approved.
- [ ] IRM approved.
- [ ] Caps/curation controls configured where applicable.
- [ ] Liquidation tested.

## Etherlink Readiness

- [ ] Chain IDs verified.
- [ ] RPC provider selected.
- [ ] Explorer verification tested.
- [ ] Deployment method tested.
- [ ] Dedicated production RPC ready.
- [ ] RPC failover and relayer funding ready for oracle operations, if applicable.
- [ ] Monitoring ready.
- [ ] Liquidation bot ready.

## Deployment Readiness

- [ ] Deployer procedure reviewed.
- [ ] Multisig/admin addresses verified.
- [ ] Dry run complete.
- [ ] Shadownet deploy complete.
- [ ] Shadownet smoke tests complete.
- [ ] Mainnet config frozen.
- [ ] Final approval recorded.

## Post-Launch

- [ ] Deployment artifacts stored.
- [ ] Contracts verified.
- [ ] Monitoring active.
- [ ] First 24-hour watch assigned.
- [ ] Incident response contacts online.
- [ ] Public docs updated.

## Blocking TODOs

- Owner: TODO release owner. Action: assign owners and dates for every unchecked item. Date: TODO before Shadownet deployment.
