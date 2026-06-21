# Upstream State and Dependency Pins

Verified on 2026-06-21 with `git ls-remote` and pinned as Git submodules.

| Repository | Commit SHA pinned | License | Use | Notes |
|---|---:|---|---|---|
| morpho-org/morpho-blue | `1478e9cfe1b4d514f80682b3b60e4e12ff3ee45a` | GPL-2.0-or-later or BUSL-1.1 | Submodule `lib/morpho-blue` | Core reference. No core logic modified. Upstream uses solc 0.8.24, via-IR, optimizer 999999, Paris EVM. |
| morpho-org/morpho-blue-irm | `a1a87fd5a7ee13873ea9d2bbd87e9c7b2cdbbef3` | MIT | Submodule `lib/morpho-blue-irm` | IRM package. Upstream notes Ethereum AdaptiveCurveIRM bytecode was deployed without via-IR; other deployments use via-IR. |
| morpho-org/morpho-blue-oracles | `e32d8902f9518365caa53e9eaed3cbd6cb017a63` | GPL-2.0-or-later or BUSL-1.1 | Submodule `lib/morpho-blue-oracles` | Reference oracle implementations. Do not assume Etherlink feed availability. |
| morpho-org/morpho-blue-deployment | `3c9ac96cf5c7352ff01739a15d6057198e76d70e` | Upstream review required before import | Reference only | Official deployment repository discovered; not imported to avoid premature deployment coupling. |
| morpho-org/metamorpho | `ae732258e55be466b959705ad2e6bc6c66e1819d` | Upstream review required before import | Reference only | Vault/periphery repository; not needed for initial Morpho Blue fork scaffold. |
| morpho-org/vault-v2 | `d9c2266b6d355a0e716f0623e2adc5f10204adae` | Upstream review required before import | Reference only | Vault V2 repository; not imported. |
| foundry-rs/forge-std | `257559546b763ec5fa7371fb77fef9102db86446` | MIT/Apache-2.0 | Submodule `lib/forge-std` | Test/script dependency. |

## Archived / Deprecated Repositories Discovered

- `morpho-org/morpho-blue-rewards-subgraph` is archived and read-only as of 2024-06-25. It is not used.
- Older MetaMorpho/Vault V1 repositories exist; this scaffold does not import vaults.

## Compatibility Notes

- Foundry settings mirror Morpho Blue defaults where practical: Solidity 0.8.24, via-IR enabled, optimizer enabled with 999999 runs, bytecode hash disabled, Paris EVM.
- IRM verification may require `profile.no_via_ir` for bytecode parity with certain historical Ethereum deployments.
- Etherlink deployment verification and `--legacy` transaction behavior must be tested on Shadownet before mainnet.
- No vendored source is flattened into this repository. Upstream source remains auditable through submodule commits.

## Commands Used

```bash
git ls-remote https://github.com/morpho-org/morpho-blue HEAD
git ls-remote https://github.com/morpho-org/morpho-blue-irm HEAD
git ls-remote https://github.com/morpho-org/morpho-blue-oracles HEAD
git ls-remote https://github.com/morpho-org/morpho-blue-deployment HEAD
git ls-remote https://github.com/morpho-org/metamorpho HEAD
git ls-remote https://github.com/morpho-org/vault-v2 HEAD
git ls-remote https://github.com/foundry-rs/forge-std HEAD
git submodule add https://github.com/foundry-rs/forge-std lib/forge-std
git submodule add https://github.com/morpho-org/morpho-blue lib/morpho-blue
git submodule add https://github.com/morpho-org/morpho-blue-irm lib/morpho-blue-irm
git submodule add https://github.com/morpho-org/morpho-blue-oracles lib/morpho-blue-oracles
git submodule update --init --recursive
git submodule status
```
