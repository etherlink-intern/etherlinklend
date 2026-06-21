# Etherlink Shadownet Preflight Report

Generated: 2026-06-21

Status: deployment package prepared; broadcast not attempted.

## 1. Git State

- Current branch: `main`
- Current commit: `eb36a2958a1de3c3b3ffe6e6dcfd1d895de720eb`
- Working tree clean: no. This report is generated while the Shadownet deployment package and prior documentation changes are unstaged.
- Submodule status: initialized.

Key upstream SHAs:

- Morpho Blue: `1478e9cfe1b4d514f80682b3b60e4e12ff3ee45a`
- Morpho Blue IRM: `a1a87fd5a7ee13873ea9d2bbd87e9c7b2cdbbef3`
- Morpho Blue oracles: `e32d8902f9518365caa53e9eaed3cbd6cb017a63`
- Forge std: `257559546b763ec5fa7371fb77fef9102db86446`

Nested dependency SHAs are visible with:

```bash
git submodule status --recursive
```

## 2. Tool Versions

- `forge`: `1.7.1` via `ghcr.io/foundry-rs/foundry:latest`
- `cast`: `1.7.1` via `ghcr.io/foundry-rs/foundry:latest`
- Root package Solidity compiler used by current build: `0.8.24`
- Upstream Morpho Blue core pragma: exact `0.8.19`; deploy-core script expects a prebuilt `Morpho.sol:Morpho` artifact for that exact upstream contract and does not modify upstream code.
- Node: `v22.22.3`
- pnpm: `10.28.1`
- Slither: not available in local PATH during this preflight.

## 3. Build Status

- `forge fmt --check`: passed.
- `forge build`: passed.
- Compiler warnings: none after final build.
- Optimizer settings: enabled, `999999` runs.
- Via IR: enabled.
- Bytecode hash: `none`.
- EVM version: `paris`.
- Remappings:

```text
forge-std/=lib/forge-std/src/
morpho-blue/=lib/morpho-blue/
morpho-blue-irm/=lib/morpho-blue-irm/
morpho-blue-oracles/=lib/morpho-blue-oracles/
solmate/=lib/morpho-blue-irm/lib/solmate/src/
openzeppelin-contracts/=lib/morpho-blue-oracles/lib/openzeppelin-contracts/
```

## 4. Test Status

- `forge test`: passed, 12 tests.
- Unit tests: passed.
- Shadownet fork/preflight tests: passed; RPC-specific fork body skips gracefully when `ETHERLINK_SHADOWNET_RPC_URL` is unset.
- Shadownet smoke tests: passed in draft/no-deployment mode.
- Invariant/fuzz scaffold: passed.
- `forge snapshot --check`: passed after regenerating `.gas-snapshot`.

## 5. Security Check Status

- Solhint: passed with `corepack pnpm lint`.
- Secret scan: passed using the repo release-check grep pattern.
- Slither: not run because Slither is not installed locally.
- TODO/blocker scan: 203 TODO/blocker markers remain, mostly in launch documentation, Shadownet artifact templates, risk templates, and production/mainnet readiness sections.

## 6. Deployment Readiness

- `docs/upstream.md`: incomplete for production; contains pinned core SHAs but leaves vault/periphery/deployment references and legal review as TODOs.
- `docs/launch-checklist.md`: not complete; mainnet remains blocked.
- `config/chains/etherlink-shadownet.json`: present, testnet-only, chain ID `127823`.
- Deployment scripts: present under `script/shadownet/` and compile.
- Market config: present at `config/markets/shadownet-test-market.json`; contains placeholders until actual Shadownet test deployment.
- Oracle config: present at `config/oracles/shadownet-test-oracle.json`; first test market uses a test-only fixed-price oracle.
- Deployer key present in env: no.
- Deployer address present in env: no.
- Shadownet RPC env present: no.
- Deployer balance command prepared:

```bash
cast balance "$DEPLOYER_ADDRESS" --rpc-url "$ETHERLINK_SHADOWNET_RPC_URL"
```

- Shadownet chain ID command prepared:

```bash
cast chain-id --rpc-url "$ETHERLINK_SHADOWNET_RPC_URL"
```

## Official Etherlink Value Check

Values in `config/chains/etherlink-shadownet.json` were checked against official Etherlink documentation on 2026-06-21:

- `https://docs.etherlink.com/get-started/network-information/`
- `https://docs.etherlink.com/network/migrating-testnet/`
- `https://docs.etherlink.com/building-on-etherlink/development-toolkits/`

Confirmed values:

- Network: Etherlink Shadownet Testnet
- Chain ID: `127823`
- RPC: `https://node.shadownet.etherlink.com`
- Explorer: `https://shadownet.explorer.etherlink.com`
- Faucet: `https://shadownet.faucet.etherlink.com/`
- Native token: `XTZ`
- Native token decimals: `18`

Re-verify immediately before any broadcast.

## Broadcast Blockers

No Shadownet broadcast may be attempted until:

- `ETHERLINK_SHADOWNET_RPC_URL` is set locally.
- `DEPLOYER_ADDRESS` is set locally.
- `PRIVATE_KEY` is set locally and remains uncommitted.
- The deployer has Shadownet XTZ.
- `cast chain-id` returns `127823`.
- `CONFIRM_SHADOWNET_DEPLOYMENT=true`.
- `SHADOWNET_BROADCAST=true` is set by the relevant Make target.
- Placeholder addresses in the selected deployment environment are replaced by actual Shadownet test deployment outputs.
- The upstream `Morpho.sol:Morpho` artifact is available for exact upstream `0.8.19` deployment or a verified intended Shadownet Morpho address is supplied.

## Package-Prep Result

No critical blocker prevents repository deployment-package preparation. Broadcast is blocked by missing local operator environment and intentionally unresolved Shadownet deployment addresses.
