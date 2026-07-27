# License And Legal Review

Status: **technical review complete, legal signoff outstanding.**

This document records the license facts for every dependency in the repository
and analyses their effect on the frozen first-launch scope. It is prepared by
engineering to make legal review cheap. It is **not** legal advice and does
**not** constitute the legal review required by `docs/launch-checklist.md`.

Review date: 2026-07-27. Repository state: `docs/upstream.md` pins as of that
date. Any pin change invalidates this review and requires a re-run.

## Scope Of This Review

In scope:

- License of every direct and nested submodule at its pinned SHA.
- Which licenses actually reach a deployable artifact, based on the frozen
  component scope in [ADR 0003](adr/0003-first-launch-component-scope.md).
- Compatibility of those licenses with each other.
- Consistency of this repository's own license declarations.

Out of scope, and left to the legal reviewer:

- Whether this repository keeps, drops, or re-scopes its BUSL-1.1 arm.
- Trademark and naming questions.
- Commercial data-licensing terms for oracle providers. That is a Phase 3
  question tracked in `config/oracles/`.
- Any jurisdiction-specific analysis.

## Dependency License Inventory

Verified by reading the `LICENSE` file at each pinned SHA, not from package
metadata or upstream README claims.

| Dependency | Pinned version | License | Reaches deployable artifact? |
|---|---|---|---|
| `morpho-blue` | `3085651` | GPL-2.0-or-later | **Yes** |
| `morpho-blue-irm` | `a1a87fd` | MIT | **Yes** |
| `morpho-blue-oracles` | `a036def` | GPL-2.0-or-later | **Yes**, if Phase 3 selects it |
| `openzeppelin-contracts` | v5.0.0 (`932fddf`) | MIT | **Yes**, via the oracle path |
| `forge-std` (root) | v1.16.2 (`bf647bd`) | MIT / Apache-2.0 dual | No — test and script tooling |
| `solmate` | `fadb2e2` | **AGPL-3.0** | **No** — see Finding 1 |
| `ds-test` | `e282159` / `cd98eff` | GPL-3.0 | No — test tooling |
| `halmos-cheatcodes` | `a02072c` | AGPL-3.0 | No — formal-verification tooling |
| `erc4626-tests` | v0.1.0 (`8b1d7c2`) | AGPL-3.0 | No — upstream OZ test suite |

Nested `forge-std` copies exist inside `morpho-blue`, `morpho-blue-irm`, and
`morpho-blue-oracles` at older versions. They are test tooling for those
upstream repositories and are not used by this repository's build, which
remaps `forge-std/` to the root copy.

## Deployable Closure Analysis

The question that matters is not "what is in `lib/`" but "what compiles into a
contract we deploy". The transitive Solidity import closure was computed for
each in-scope component from ADR 0003 and every file's SPDX header was read.

| Deployable component | Files in closure | Licenses present |
|---|---:|---|
| `Morpho` singleton | 14 | GPL-2.0-or-later (14) |
| `AdaptiveCurveIrm` | 11 | GPL-2.0-or-later (4), MIT (7) |
| `MorphoChainlinkOracleV2` | 9 | GPL-2.0-or-later (7), MIT (2) |

**No AGPL-3.0 or GPL-3.0 file appears in any deployable closure.** The closure
resolved with no unresolved imports.

The two MIT files in the oracle closure are
`openzeppelin-contracts/contracts/utils/math/Math.sol` and the local
`AggregatorV3Interface.sol`.

Reproduce with the script in the Verification section.

## Findings

### Finding 1 — AGPL-3.0 is present in the repository but not in production

**Severity: informational. Resolves an open blocking TODO.**

`docs/upstream.md` previously recorded Solmate as "TODO verify before launch"
with the note "License review required if used in production artifacts". That
question is now answered.

Solmate is **AGPL-3.0**. It is reachable from this repository only through the
`solmate/=` remapping and is referenced by `lib/morpho-blue-irm/test/ExpLibTest.sol`,
an upstream test file, and by `forge-std` mocks. It is **not** imported by
`AdaptiveCurveIrm` or by any other in-scope component, and it does not appear
in any deployable closure above.

The same applies to `halmos-cheatcodes` and `erc4626-tests` (both AGPL-3.0) and
`ds-test` (GPL-3.0): all are test or verification tooling.

Conclusion: AGPL-3.0 obligations, including the network-use provision, are
**not triggered by the frozen launch scope**. This holds only while the scope
holds.

### Finding 2 — The BUSL-1.1 arm no longer has an upstream basis

**Severity: requires a legal decision. Blocks the "Licenses reviewed" gate.**

Upstream Morpho removed the BUSL-1.1 option from `morpho-blue`
(morpho-org/morpho-blue#778) and `morpho-blue-oracles`
(morpho-org/morpho-blue-oracles#120). Both pins were advanced across that
change. At the current pins, both dependencies are GPL-2.0-or-later only.

This repository's `LICENSE`, `NOTICE`, and all 21 of its `.sol` files declare
`GPL-2.0-or-later OR BUSL-1.1`, with `LICENSE` stating this matches "Morpho
Blue compatibility requirements". That stated basis no longer exists at the
current pins.

Note for the reviewer: license grants are not retroactively revoked. Code at
the previous SHA (`1478e9c`) was offered under the dual option and remains
available on those terms *at that SHA*. The constraint applies to the SHA we
actually pin and ship.

Five repository files import `morpho-blue` headers directly and are the
clearest candidates for being derivative works:

- `src/testnet/TestOnlyFixedPriceOracle.sol` (`IOracle`)
- `script/shadownet/03_DeployIRMAndOracle.s.sol` (`FixedRateIrm`)
- `script/shadownet/04_CreateTestMarket.s.sol` (`IMorpho`, `MarketParamsLib`)
- `script/shadownet/05_SmokeTestMarket.s.sol` (`IMorpho`, `MarketParamsLib`, `IOracle`)
- `test/unit/Placeholder.t.sol` (`IMorpho`, `IIrm`, `IOracle`)

All five are test-only or Shadownet-only and none is deployed to mainnet under
ADR 0003, which narrows but does not eliminate the question.

**Decision required from legal.** The options, stated neutrally:

1. Drop the BUSL-1.1 arm and license the repository GPL-2.0-or-later only.
   Simplest and matches upstream. Forfeits any source-available commercial
   position.
2. Keep the dual declaration but scope the BUSL-1.1 arm explicitly to
   first-party files that are not derivative of GPL upstream code, and mark
   the rest GPL-2.0-or-later. Requires per-file discipline that the current
   blanket header does not provide.
3. Keep the current declaration on the basis of separate permission from the
   copyright holders. Requires that permission to exist in writing.

Engineering has no position on which option is correct. What engineering can
say is that option 2 requires per-file SPDX changes and a rule that future
contributors can follow, and that the current blanket header does not
distinguish the five files above from the rest.

### Finding 3 — The `solmate/` remapping is an unguarded path to AGPL-3.0

**Severity: low. Preventive.**

`remappings.txt` contains:

```
solmate/=lib/morpho-blue-irm/lib/solmate/src/
```

No file in `src/`, `script/`, or `test/` currently imports through it —
verified. But the remapping means a future contract can write
`import "solmate/..."` and pull AGPL-3.0 code into a production artifact with
no signal that anything license-relevant happened. Finding 1's conclusion
would silently stop holding.

Recommended action, for the protocol engineer rather than legal: either remove
the remapping, or keep it and add a CI check asserting that no file under
`src/` imports through it. This PR does **not** change `remappings.txt` —
Solmate is legitimately used by upstream IRM tests and whether we want it
available to our own tests is a build decision, not a licensing one.

### Finding 4 — Attribution obligations are met but under-documented

**Severity: low.**

GPL-2.0-or-later and MIT both require preserving copyright notices and license
text. Upstream SPDX headers are intact in all submodules — no header has been
stripped, consistent with `docs/fork-policy.md`. `NOTICE` names the upstream
projects but predates the license changes above and does not state which
license each dependency carries. The `NOTICE` update in this change set
addresses that.

## Compatibility Conclusion

For the frozen launch scope, the combined deployable work consists of
GPL-2.0-or-later and MIT code. MIT is permissive and GPL-compatible, so the
combination is distributable under GPL-2.0-or-later. No AGPL-3.0 or GPL-3.0
code participates.

The unresolved item is Finding 2: what this repository declares about itself.
That is a legal decision, not a technical one.

## Verification

```bash
# Per-dependency license, read from the pinned checkout
for d in lib/forge-std lib/morpho-blue lib/morpho-blue-irm lib/morpho-blue-oracles \
         lib/morpho-blue-irm/lib/solmate \
         lib/morpho-blue-oracles/lib/openzeppelin-contracts; do
  echo "$d: $(head -3 $d/LICENSE* 2>/dev/null | tr -s ' \n' ' ' | cut -c1-60)"
done

# Repo files that import upstream Morpho headers
grep -rn 'morpho-blue/' src script test --include=*.sol

# Confirm nothing imports through the solmate remapping
grep -rn 'solmate/' src script test --include=*.sol   # expect no output
```

The deployable-closure table is reproduced by `tools/license/closure.py`, which
walks Solidity imports from each entry point and reports the SPDX header of
every file reached:

```bash
python3 tools/license/closure.py
```

## Signoff

Legal signoff is **outstanding**. This section is the gate; do not mark
"Licenses reviewed" in `docs/launch-checklist.md` until it is filled in.

```text
Reviewer:
Role:
Date:
Pins reviewed: docs/upstream.md as of <commit SHA>
Finding 2 decision: option 1 | option 2 | option 3 | other
Rationale:
Required follow-up changes to LICENSE / NOTICE / SPDX headers:
Approved for mainnet distribution: yes | no
```

## Blocking TODOs

- Owner: TODO legal reviewer. Action: decide Finding 2 and complete the
  Signoff block. Date: TODO before mainnet release.
- Owner: TODO protocol engineer. Action: decide Finding 3, then either remove
  the `solmate/` remapping or add the CI guard. Date: TODO before Shadownet
  deployment.
- Owner: TODO release owner. Action: re-run this review whenever a pin in
  `docs/upstream.md` changes. Date: ongoing.
