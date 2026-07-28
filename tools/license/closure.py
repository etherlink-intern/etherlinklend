#!/usr/bin/env python3
"""Report the SPDX licenses reachable from each deployable component.

Walks the transitive Solidity import graph from the components frozen in
docs/adr/0003-first-launch-component-scope.md and prints the SPDX identifier of
every file reached. Used to answer one question: does any copyleft license we
do not intend to ship reach a contract we actually deploy?

Exits non-zero when the answer cannot be trusted, not only when it is bad:

  * a disallowed license appears in a deployable closure
  * an import cannot be resolved, so the closure is incomplete
  * an entry point is missing, so nothing was examined
  * a component is still PROVISIONAL, i.e. the contract that will actually be
    deployed has not been chosen yet

That last case is why --allow-provisional exists. ADR 0003 defers the oracle
implementation to Phase 3, so today the oracle entry below is a placeholder for
a decision nobody has made. Reporting OK against a placeholder would let a
different oracle ship without ever being analysed, so the default is to fail.
Pass --allow-provisional to acknowledge the gap and check everything else.

Run from the repository root, with submodules initialised:

    python3 tools/license/closure.py [--allow-provisional]
"""

import os
import re
import sys

# Entry points frozen by ADR 0003.
#
# provisional=True means "ADR 0003 has not selected this contract yet". The
# oracle is the reference implementation named in the ADR, not a decision.
# When Phase 3 selects the production oracle, replace this entry with the
# chosen contract and set provisional=False; per docs/license-review.md that
# selection change also requires the review itself to be rerun.
ENTRY_POINTS = [
    ("Morpho singleton", "lib/morpho-blue/src/Morpho.sol", False),
    ("AdaptiveCurveIrm", "lib/morpho-blue-irm/src/adaptive-curve-irm/AdaptiveCurveIrm.sol", False),
    ("MorphoChainlinkOracleV2", "lib/morpho-blue-oracles/src/morpho-chainlink/MorphoChainlinkOracleV2.sol", True),
]

# Licenses permitted in a deployable artifact. Anything else is a finding:
# AGPL-3.0 in particular carries a network-use obligation we do not intend to
# take on. See docs/license-review.md Finding 1.
ALLOWED = {"GPL-2.0-or-later", "MIT"}

# Covers every Solidity import directive form:
#   import "path";
#   import "path" as X;
#   import {A, B} from "path";
#   import * as X from "path";
#   import X from "path";
# The optional group swallows anything up to the `from` keyword, so alias and
# namespace forms resolve instead of being silently dropped along with their
# entire transitive subtree.
IMPORT_RE = re.compile(r"""import\s+(?:[^;"']*?\bfrom\s+)?["']([^"']+)["']""")
SPDX_RE = re.compile(r"SPDX-License-Identifier:\s*(.+?)\s*$")


def read_remappings(root):
    path = os.path.join(root, "remappings.txt")
    pairs = []
    if os.path.isfile(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                prefix, target = line.split("=", 1)
                pairs.append((prefix, target))
    # Longest prefix first so "morpho-blue-irm/" beats "morpho-blue/".
    return sorted(pairs, key=lambda p: len(p[0]), reverse=True)


def resolve(spec, importer, root, remappings):
    if spec.startswith("."):
        return os.path.normpath(os.path.join(os.path.dirname(importer), spec))
    for prefix, target in remappings:
        if spec.startswith(prefix):
            return os.path.normpath(os.path.join(root, target + spec[len(prefix):]))
    return os.path.normpath(os.path.join(root, spec))


def spdx_of(path):
    with open(path, encoding="utf-8", errors="replace") as handle:
        for line in handle.read().splitlines()[:5]:
            found = SPDX_RE.search(line)
            if found:
                return found.group(1)
    return "NONE"


def closure(entry, root, remappings, unresolved):
    seen, stack = set(), [os.path.normpath(entry)]
    while stack:
        current = stack.pop()
        if current in seen:
            continue
        if not os.path.isfile(current):
            unresolved.append(current)
            continue
        seen.add(current)
        with open(current, encoding="utf-8", errors="replace") as handle:
            source = handle.read()
        for match in IMPORT_RE.finditer(source):
            stack.append(resolve(match.group(1), current, root, remappings))
    return seen


def main(argv):
    allow_provisional = "--allow-provisional" in argv
    root = os.getcwd()
    remappings = read_remappings(root)
    unresolved, violations, missing, provisional = [], [], [], []

    for name, entry, is_provisional in ENTRY_POINTS:
        if is_provisional:
            provisional.append(name)
        if not os.path.isfile(entry):
            missing.append(f"{name}: {entry}")
            print(f"MISSING {name}: {entry} not found "
                  f"(run git submodule update --init --recursive)")
            continue
        files = closure(entry, root, remappings, unresolved)
        by_license = {}
        for path in files:
            by_license.setdefault(spdx_of(path), []).append(path)

        flag = "  [PROVISIONAL - not the selected oracle]" if is_provisional else ""
        print(f"\n{name}  ({len(files)} files){flag}")
        for license_id in sorted(by_license):
            paths = by_license[license_id]
            bad = "" if license_id in ALLOWED else "   <-- NOT ALLOWED IN A DEPLOYABLE ARTIFACT"
            print(f"  {license_id:24s} {len(paths):3d} file(s){bad}")
            if license_id not in ALLOWED:
                violations.extend(paths)
                for path in sorted(paths):
                    print(f"      {os.path.relpath(path, root)}")

    if missing:
        print("\nMissing entry points (nothing was examined for these):")
        for item in missing:
            print(f"  {item}")

    if unresolved:
        print("\nUnresolved imports (closure is incomplete, result is not trustworthy):")
        for path in sorted(set(unresolved)):
            print(f"  {path}")

    if provisional:
        print(f"\nPROVISIONAL components: {', '.join(provisional)}")
        print("  ADR 0003 defers the oracle implementation to Phase 3. The contract")
        print("  analysed above is the ADR's reference implementation, NOT the one")
        print("  selected for deployment. This closure does not cover whatever Phase 3")
        print("  chooses. Re-run docs/license-review.md when the oracle is selected.")

    if violations or unresolved or missing:
        print("\nFAIL")
        return 1
    if provisional and not allow_provisional:
        print("\nFAIL: provisional component(s) present; pass --allow-provisional to")
        print("      accept the gap and check the settled components only.")
        return 1

    scope = "settled components" if provisional else "every deployable closure"
    print(f"\nOK: {scope} within " + ", ".join(sorted(ALLOWED)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
