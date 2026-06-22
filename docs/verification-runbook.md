# Verification Runbook

## Source Verification

Contracts MUST be verified on the Etherlink explorer where supported. For Blockscout-style Etherlink explorers:

```bash
# Mainnet
forge verify-contract <ADDRESS> <CONTRACT> \
  --verifier blockscout \
  --verifier-url https://explorer.etherlink.com/api/

# Shadownet
forge verify-contract <ADDRESS> <CONTRACT> \
  --verifier blockscout \
  --verifier-url https://shadownet.explorer.etherlink.com/api/
```

Verification artifacts MUST store:

- Compiler version.
- Optimizer settings.
- Via-IR setting.
- Bytecode hash setting.
- Constructor arguments.
- Source commit.
- Explorer URL.
- Verification timestamp.

The exact Etherlink explorer and verifier behavior MUST be tested on Shadownet before mainnet.

## Functional Smoke Tests

Post-deploy smoke tests SHOULD include:

- Market creation checks.
- Supply.
- Borrow.
- Repay.
- Withdraw.
- Liquidation path.
- Oracle stale/revert handling.
- Paused or disabled asset behavior where relevant.
- Event emission and indexer visibility.

## Fork Tests

- Mainnet fork tests SHOULD NOT require private keys.
- Shadownet fork tests MUST run before any mainnet deployment.
- Fork tests MUST check deployed addresses against recorded deployment artifacts.
- Fork tests SHOULD include oracle staleness, decimals, liquidation path, and repeated dust operation cases.

## Config Verification

Every market config MUST verify:

- Token decimals.
- Oracle decimals.
- LLTV.
- IRM.
- Caps or curation controls where applicable.
- Owner/admin addresses.
- Oracle staleness parameters.
- Loan asset and collateral asset addresses.
- Deployment artifact consistency.

## Monitoring Verification

Before market visibility:

- Bad debt alerts MUST be active.
- Utilization alerts MUST be active.
- Oracle stale alerts MUST be active.
- Liquidation opportunity alerts MUST be active.
- Abnormal event-volume alerts SHOULD be active.
- RPC/indexer failure alerts SHOULD be active.

## Blocking TODOs

- Owner: TODO deployment owner. Action: verify Blockscout verification command against official Etherlink explorer documentation. Date: TODO before Shadownet deploy.
- Owner: TODO protocol engineer. Action: define artifact-to-fork-test assertion format. Date: TODO before first deployment artifact.
