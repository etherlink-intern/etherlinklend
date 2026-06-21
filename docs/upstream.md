# Upstream Dependencies

## Purpose

This file records exact upstream dependencies and references for the Etherlink Morpho deployment. It is a release-blocking file: production deployment MUST NOT proceed if any required upstream component has an unknown SHA, unclear license, or unreviewed purpose.

The rows below reflect the current local repository/submodule state. Before deployment, every factual upstream detail MUST be verified against official upstream repositories, releases, and license files.

## Required Upstream Repositories

| Component | Upstream repo | Commit SHA | License | Usage | Local path | Status | Notes |
|---|---|---|---|---|---|---|---|
| Morpho Blue core | `https://github.com/morpho-org/morpho-blue` | `1478e9cfe1b4d514f80682b3b60e4e12ff3ee45a` | GPL-2.0-or-later or BUSL-1.1, verify before launch | Core reference and interfaces | `lib/morpho-blue` | Pinned submodule | No core logic modified in this scaffold. |
| Morpho Blue IRM | `https://github.com/morpho-org/morpho-blue-irm` | `a1a87fd5a7ee13873ea9d2bbd87e9c7b2cdbbef3` | MIT, verify before launch | IRM package/reference | `lib/morpho-blue-irm` | Pinned submodule | Verification settings may differ by historical deployment. |
| Morpho Blue oracles | `https://github.com/morpho-org/morpho-blue-oracles` | `e32d8902f9518365caa53e9eaed3cbd6cb017a63` | GPL-2.0-or-later or BUSL-1.1, verify before launch | Reference oracle implementations | `lib/morpho-blue-oracles` | Pinned submodule | Do not assume Etherlink feed availability. |
| Forge std | `https://github.com/foundry-rs/forge-std` | `257559546b763ec5fa7371fb77fef9102db86446` | MIT/Apache-2.0, verify before launch | Tests and scripts | `lib/forge-std` | Pinned submodule | Development dependency. |
| OpenZeppelin contracts | `https://github.com/OpenZeppelin/openzeppelin-contracts` | `932fddf69a699a9a80fd2396fd1a2ab91cdda123` | MIT, verify before launch | Nested dependency of Morpho Blue oracles | `lib/morpho-blue-oracles/lib/openzeppelin-contracts` | Nested pinned submodule | Not a direct root dependency. |
| Solmate | `https://github.com/transmissions11/solmate` | `fadb2e2778adbf01c80275bfb99e5c14969d964b` | TODO verify before launch | Nested dependency of Morpho Blue IRM | `lib/morpho-blue-irm/lib/solmate` | Nested pinned submodule | License review required if used in production artifacts. |
| Morpho vault/periphery references | TODO official repository | TODO | TODO | Future vault/curation reference only | TODO | Not imported | Owner: TODO protocol engineer. Action: decide whether MetaMorpho or another vault layer is in scope. Date: TODO before vault design. |
| Morpho deployment references | TODO official repository | TODO | TODO | Reference only | TODO | Not imported | Owner: TODO deployment owner. Action: verify official deployment process before replacing placeholder scripts. Date: TODO before Shadownet deploy. |

## Pinning Policy

- All SHAs are required before production.
- Floating branches are forbidden for production.
- Dependency updates MUST go through pull request review.
- Upstream audit reports SHOULD be linked or copied into `audits/upstream/` where licenses permit.
- A dependency update MUST be treated as a security event and run through build, unit, fork, invariant, fuzz, static-analysis, and license checks.

## Verification Commands

```bash
git submodule status --recursive
git -C lib/morpho-blue rev-parse HEAD
git -C lib/morpho-blue-irm rev-parse HEAD
git -C lib/morpho-blue-oracles rev-parse HEAD
git -C lib/forge-std rev-parse HEAD
forge tree
forge build
git diff <upstream-sha>
```

For a fork diff, compare the exact upstream SHA to the local version and classify every changed file as documentation, config, scripts, tests, periphery, or protocol logic.

## License Notes

- Morpho attribution MUST be preserved.
- Upstream notices and copyright headers MUST NOT be removed.
- GPL-2.0-or-later/BUSL-1.1 compatibility MUST be confirmed where applicable.
- Legal review is required before production deployment.
- No endorsement by Morpho or any upstream project is claimed.

## Blocking TODOs

- Owner: TODO legal reviewer. Action: confirm licenses for all direct and nested dependencies. Date: TODO before mainnet release.
- Owner: TODO protocol engineer. Action: link or archive upstream audit reports where license permits. Date: TODO before external audit.
- Owner: TODO deployment owner. Action: verify official deployment process against upstream Morpho references. Date: TODO before Shadownet deploy.
