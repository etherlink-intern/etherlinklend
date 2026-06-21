# Etherlink Morpho Blue-Compatible Lending Scaffold

This repository is a production-quality foundation for a licensed, auditable Etherlink-oriented Morpho Blue-compatible fork/clone. It intentionally avoids protocol logic changes and deployments.

> **Warning:** this is an unaudited scaffold, not production-ready, and not approved for handling funds.

## Upstream Dependency Policy

Morpho upstream repositories are pinned by commit SHA as Git submodules under `lib/`. Do not float branches. Preserve upstream licenses, notices, copyright headers, and attribution. See `docs/upstream.md`.

## License and Attribution

This scaffold follows GPL-2.0-or-later/BUSL-1.1 compatibility where Morpho Blue code is involved. Upstream dependencies retain their own licenses. See `LICENSE` and `NOTICE`; legal review is required before production release.

## Package Manager

pnpm is used for lightweight JavaScript tooling such as Solhint. Foundry remains the primary Solidity toolchain.

## Installation

```bash
git submodule update --init --recursive
pnpm install --frozen-lockfile
make install
```

## Build

```bash
forge build
make build
```

## Test

```bash
forge test
make test
forge snapshot
```

## Format and Static Analysis

```bash
forge fmt --check
make slither
pnpm lint
```

## Local Anvil Tests

Run Anvil in a separate terminal, then run normal tests or scripts against `http://127.0.0.1:8545`. Unit tests do not require secrets.

## Etherlink Fork Tests

```bash
make fork-shadownet
make fork-mainnet
```

Set `ETHERLINK_SHADOWNET_RPC_URL` or `ETHERLINK_MAINNET_RPC_URL` first. Fork tests skip their fork body when RPC env vars are absent.

## Deployment Records

No deployment is performed by this scaffold. Future artifacts belong under `deployments/<chain>/` with transaction hashes, bytecode metadata, constructor args, compiler settings, and verification links. Never store secrets.

## Security

See `SECURITY.md` for responsible disclosure and scope. Reports should avoid exploiting live funds.

## Launch Gates

Before launch: pinned upstream commits, legal review, fork diff, clean build, passing tests/fuzz/invariants/fork tests, reviewed Slither output, verified oracle/token addresses/decimals, approved risk parameters, tested liquidators, external audit, no high/critical findings, dry run, testnet deploy, verification, and monitoring readiness.

## Common Commands

```bash
git submodule update --init --recursive
forge build
forge test
forge fmt --check
forge snapshot
make test
make slither
make fork-shadownet
make fork-mainnet
```
