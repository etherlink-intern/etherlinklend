# Deployment Runbook

## Deployment Philosophy

No mainnet-first deployments are allowed. The Etherlink Morpho deployment MUST go through dry run, Etherlink Shadownet deployment, verification, smoke tests, monitoring readiness, liquidation readiness, and final approval before mainnet.

This runbook does not approve deployment. It defines the required process.

## Pre-Deployment Checklist

Before any Shadownet or mainnet broadcast:

- Upstream SHAs MUST be pinned.
- Licenses MUST be reviewed.
- Fork diff MUST be generated and reviewed.
- Tests MUST be passing.
- Static analysis MUST be complete.
- External audit MUST be complete before mainnet.
- Market config MUST be reviewed.
- Oracle config MUST be verified.
- Token decimals MUST be verified.
- Risk owner approval MUST be recorded.
- Deployer key procedure MUST be reviewed.
- Multisig/admin plan MUST be documented.
- Emergency response MUST be prepared.

## Dry Run

Dry runs MUST:

- Run local deployment simulation before broadcast.
- Capture constructor arguments.
- Capture compiler version and optimizer settings.
- Confirm addresses are deterministic only if intentionally designed.
- Confirm no placeholder addresses, owners, keys, feed IDs, or configs remain.
- Archive logs and config snapshots.

Example:

```bash
make dry-run-shadownet
```

## Shadownet Deployment

Etherlink Shadownet MUST be used before mainnet.

Shadownet deployment requirements:

- Deploy testnet-only contracts/configuration.
- Verify contracts.
- Create test markets only.
- Run smoke tests.
- Run oracle tests.
- Run liquidation tests.
- Run monitoring checks.
- Record deployment artifacts.

Shadownet success does not authorize mainnet deployment. It is one launch gate.

## Mainnet Deployment

Mainnet deployment requires:

- Completed launch checklist.
- Explicit approval.
- Final config freeze.
- Deployment artifact recording.
- Post-deploy verification.
- Monitoring online before user access.
- Liquidation readiness before market visibility.

## Market Creation Process

For each market:

- Loan asset MUST be reviewed.
- Collateral asset MUST be reviewed.
- Oracle MUST be reviewed.
- IRM MUST be reviewed.
- LLTV MUST be approved.
- Caps or curation controls MUST be configured where applicable.
- Liquidation path MUST be tested.
- Monitoring MUST be configured.
- Frontend and indexer config MUST be reviewed.

## Artifact Format

Deployment artifacts SHOULD be JSON and include:

```json
{
  "chainId": 127823,
  "chainName": "Etherlink Shadownet",
  "deployer": "0xTODO",
  "txHash": "0xTODO",
  "contractName": "TODO",
  "contractAddress": "0xTODO",
  "constructorArgs": [],
  "compilerVersion": "0.8.24",
  "optimizerSettings": {
    "enabled": true,
    "runs": 999999,
    "viaIR": true,
    "bytecodeHash": "none"
  },
  "sourceCommit": "TODO",
  "timestamp": "TODO_ISO8601",
  "verified": false,
  "notes": "TODO"
}
```

Do not commit private keys, secret RPC URLs, seed phrases, or unverified production addresses.
