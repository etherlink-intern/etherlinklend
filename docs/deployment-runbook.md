# Deployment Runbook

1. Pre-deploy: pin commits, review license, generate fork diff, run tests/static analysis, verify token/oracle/IRM addresses, confirm no secrets.
2. Dry run: run scripts without broadcast and archive logs.
3. Testnet deploy: Shadownet only after explicit approval.
4. Verification: verify bytecode, constructor args, compiler settings, and explorer metadata.
5. Smoke tests: read core state, run market creation dry checks, test oracle reads, confirm bots/indexers.
6. Market creation: require asset diligence, risk parameter approval, oracle review, liquidation route testing.
7. Emergency assumptions: document immutable/no-pause behavior for Morpho components and any periphery controls.
8. Mainnet deploy: require external audit completion and launch checklist approval.
9. Artifacts: record under `deployments/<chain>/` with no secrets.
