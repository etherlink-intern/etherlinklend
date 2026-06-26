# Etherlink Morpho Deployment Scaffold

**Website:** [etherlinklend.etherlinkinsights.com](https://etherlinklend.etherlinkinsights.com) — informational project landing page. No protocol is deployed; nothing here is live or usable with funds.

This repository is an unaudited planning and scaffold repository for an Etherlink Morpho deployment. It is not production-ready, no production deployment is approved, and no contract in this repository should be used with live funds until every launch gate is complete.

The goal is to prepare an auditable Morpho Blue-based lending deployment for Etherlink. This task populates documentation, launch planning, and risk-process materials only. It does not deploy contracts and does not implement protocol logic.

## Project Status

- Status: planning and scaffold only.
- Production approval: not granted.
- Deployment status: no production deployment approved or performed.
- Current objective: document the selected architecture, safety requirements, launch gates, market review process, and Etherlink-specific operational assumptions.

Any factual chain, oracle, or upstream-repository detail in this repository MUST be verified against official sources before deployment.

## Architecture Decision

The selected initial path is Morpho Blue isolated lending markets on Etherlink. A market is an isolated loan-token, collateral-token, oracle, IRM, and LLTV tuple.

Isolated markets were selected because they provide:

- Smaller blast radius per market.
- Clearer risk ownership per loan asset and collateral asset pair.
- Easier launch sequencing from one market to a small set of markets.
- Cleaner risk review than cloning old Aave or Compound forks.
- A better fit for market-by-market oracle and liquidation validation.

Aave V3 Origin, Compound III / Comet, and Euler V2 / EVK remain useful reference architectures. They are not the initial implementation target. Old Aave V2, stale Aave V3, Compound V2, abandoned forks, and the Superlend codebase are not the chosen base.

## Etherlink Target

Expected network configuration:

| Network | Expected chain ID | Native token | RPC env var | Status |
|---|---:|---|---|---|
| Etherlink Mainnet | `42793` | `XTZ` | `ETHERLINK_MAINNET_RPC_URL` | Not approved for production until launch checklist completion |
| Etherlink Shadownet | `127823` | `XTZ` | `ETHERLINK_SHADOWNET_RPC_URL` | Testnet only |

These values MUST be verified against official Etherlink documentation before deployment.

Public RPCs MAY be used for development and read-only experiments. Production bots, monitoring, liquidation infrastructure, and post-launch operations MUST use dedicated, reliable RPC infrastructure with alerting and failover planning.

## Security-First Launch Posture

Mainnet deployment MUST NOT happen before all of the following are complete:

- Upstream commit pinning.
- License review.
- Fork-diff review.
- Unit tests.
- Fork tests.
- Fuzz and invariant tests.
- Static analysis.
- Oracle review.
- Risk-parameter approval.
- External audit.
- Etherlink Shadownet deployment.
- Monitoring readiness.
- Liquidation bot readiness.
- Emergency-response rehearsal.

Forking a mature lending protocol does not make the deployment safe. Upstream protocol risk, fork/deployment risk, market-configuration risk, oracle risk, token behavior risk, liquidation risk, and Etherlink-specific risk MUST be evaluated separately.

## Commands

### Install

```bash
git submodule update --init --recursive
pnpm install --frozen-lockfile
make install
```

### Build

```bash
forge build
make build
```

### Test

```bash
forge test
forge snapshot
make test
```

### Format Check

```bash
forge fmt --check
make fmt-check
```

### Static Analysis

```bash
make slither
pnpm lint
```

### Oracle Price Monitor

```bash
pnpm oracle:prices
pnpm oracle:prices:table
pnpm oracle:serve
```

The JSON-RPC monitor defaults to a 15-minute source refresh cadence so repeated product reads do not repeatedly hit upstream API rate limits.

### Fork Test Shadownet

```bash
make fork-shadownet
```

Set `ETHERLINK_SHADOWNET_RPC_URL` first.

### Fork Test Mainnet

```bash
make fork-mainnet
```

Set `ETHERLINK_MAINNET_RPC_URL` first. Mainnet fork tests MUST NOT require private keys.

### Dry-Run Deployment

```bash
make dry-run-shadownet
```

Dry runs SHOULD be archived with compiler settings, constructor arguments, expected addresses if deterministic, and source commit.

### Deployment Artifact Recording

Deployment artifacts MUST be recorded under `deployments/<chain>/` after every broadcast. A deployment artifact includes addresses, constructor arguments, transaction hashes, compiler settings, verification status, config snapshots, deployer identity, source commit, and reviewer notes.

## Warning

Forking a mature lending protocol does not make an Etherlink Morpho deployment safe.

Common failure points include market configuration, oracle selection, token behavior, decimals, liquidity, liquidation infrastructure, deployment scripts, and monitoring. Etherlink's low fees make repeated dust transactions, rounding loops, share/accounting edge cases, and oracle edge cases especially important to test with high iteration counts.

A prior Etherlink lending deployment reportedly suffered a rounding-related incident affecting BTC markets. This repository treats that as a warning, not as a substitute for a postmortem. The actual incident details MUST be collected and reviewed before launch.

## Document Map

| Area | Document |
|---|---|
| Architecture decision | [docs/architecture.md](docs/architecture.md) |
| Fork policy | [docs/fork-policy.md](docs/fork-policy.md) |
| Threat model | [docs/threat-model.md](docs/threat-model.md) |
| Etherlink notes | [docs/etherlink-notes.md](docs/etherlink-notes.md) |
| Deployment runbook | [docs/deployment-runbook.md](docs/deployment-runbook.md) |
| Verification runbook | [docs/verification-runbook.md](docs/verification-runbook.md) |
| Emergency response | [docs/emergency-response.md](docs/emergency-response.md) |
| Launch checklist | [docs/launch-checklist.md](docs/launch-checklist.md) |
| Market templates | [config/markets/README.md](config/markets/README.md) |
| Oracle notes | [config/oracles/README.md](config/oracles/README.md) |
| RedStone RPC/feed plan | [config/oracles/redstone-rpc-feed-plan.md](config/oracles/redstone-rpc-feed-plan.md) |
| Price source monitor | [docs/oracle-price-monitor.md](docs/oracle-price-monitor.md) |
| Risk templates | [config/risk/README.md](config/risk/README.md) |
| Upstream pins | [docs/upstream.md](docs/upstream.md) |
| Audit tracking | [audits/README.md](audits/README.md) |

## Contributing

Contributions are welcome for documentation, tests, monitoring, deployment checks, and risk-review improvements. Please keep changes narrowly scoped, include the relevant verification command output in pull requests, and do not introduce production-deployment assumptions without linking to the launch checklist and risk review that justify them.

Security-sensitive findings should follow [SECURITY.md](SECURITY.md) instead of public issue discussion. Do not include private keys, RPC credentials, deployment secrets, or exploitable live-market details in issues, commits, or pull requests.

## License And Notices

This repository scaffold is licensed under `GPL-2.0-or-later OR BUSL-1.1`, matching Morpho Blue compatibility requirements where applicable. See [LICENSE](LICENSE) for the repository license statement and [NOTICE](NOTICE) for attribution and upstream notice information.

Upstream dependencies, submodules, and referenced protocols retain their own licenses. Legal review is required before production release or any live-funds deployment.
