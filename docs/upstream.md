# Upstream Dependencies

## Purpose

This file records exact upstream dependencies and references for the Etherlink Morpho deployment. It is a release-blocking file: production deployment MUST NOT proceed if any required upstream component has an unknown SHA, unclear license, or unreviewed purpose.

The rows below reflect the current local repository/submodule state. Before deployment, every factual upstream detail MUST be verified against official upstream repositories, releases, and license files.

## Required Upstream Repositories

| Component | Upstream repo | Commit SHA | License | Usage | Local path | Status | Notes |
|---|---|---|---|---|---|---|---|
| Morpho Blue core | `https://github.com/morpho-org/morpho-blue` | `3085651a79553bbabbfd8be309c262dab45b686e` | GPL-2.0-or-later (BUSL-1.1 option removed upstream, see License Notes) | Core reference and interfaces | `lib/morpho-blue` | Pinned submodule | No core logic modified in this scaffold. Updated via PR #38; range contains no `src/` changes. |
| Morpho Blue IRM | `https://github.com/morpho-org/morpho-blue-irm` | `a1a87fd5a7ee13873ea9d2bbd87e9c7b2cdbbef3` | MIT, verify before launch | IRM package/reference | `lib/morpho-blue-irm` | Pinned submodule | Verification settings may differ by historical deployment. |
| Morpho Blue oracles | `https://github.com/morpho-org/morpho-blue-oracles` | `a036defc62db58a0cc692b90c83148b1b9bc8052` | GPL-2.0-or-later (BUSL-1.1 option removed upstream, see License Notes) | Reference oracle implementations | `lib/morpho-blue-oracles` | Pinned submodule | Do not assume Etherlink feed availability. Updated via PR #35; range is a `LICENSE`-only change. |
| Forge std | `https://github.com/foundry-rs/forge-std` | `bf647bd6046f2f7da30d0c2bf435e5c76a780c1b` | MIT/Apache-2.0, verify before launch | Tests and scripts | `lib/forge-std` | Pinned submodule | Development dependency. v1.16.2, updated via PR #28. |
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

### Upstream BUSL-1.1 Removal (2026-07-27)

Upstream Morpho removed the Business Source License option from both
`morpho-blue` (morpho-org/morpho-blue#778) and `morpho-blue-oracles`
(morpho-org/morpho-blue-oracles#120), replacing the dual-option `LICENSE` file
with standard GPLv2 text. Both pins were advanced across that change in PR #38
and PR #35.

Verified at the current pins:

- `lib/morpho-blue/LICENSE` and `lib/morpho-blue-oracles/LICENSE` are now plain
  GNU GPL v2 text with no BUSL-1.1 option.
- SPDX headers in upstream sources are unchanged: `GPL-2.0-or-later`.
- Neither bump changed any Solidity source. The `morpho-blue` range touches
  `LICENSE`, `README.md`, Certora specs/conf, `foundry.toml`, and
  `foundry.lock`; the `morpho-blue-oracles` range touches `LICENSE` only.

Open question for legal review: this repository's own `LICENSE` and `NOTICE`
state `GPL-2.0-or-later OR BUSL-1.1` "matching Morpho Blue compatibility
requirements". The upstream basis for offering the BUSL-1.1 arm no longer
exists for these two dependencies. Whether this repository keeps, drops, or
re-scopes its BUSL-1.1 arm is a legal decision and is NOT made here. The
factual record above is what changed; the licensing position is unchanged
pending review.

## Blocking TODOs

- Owner: TODO legal reviewer. Action: confirm licenses for all direct and nested dependencies. Date: TODO before mainnet release.
- Owner: TODO legal reviewer. Action: decide whether this repository keeps its
  `GPL-2.0-or-later OR BUSL-1.1` arm now that upstream Morpho Blue and Morpho
  Blue oracles are GPLv2-only, and update `LICENSE`/`NOTICE` accordingly. See
  "Upstream BUSL-1.1 Removal (2026-07-27)". Date: TODO before mainnet release.
- Owner: TODO protocol engineer. Action: link or archive upstream audit reports where license permits. Date: TODO before external audit.
- Owner: TODO deployment owner. Action: verify official deployment process against upstream Morpho references. Date: TODO before Shadownet deploy.
