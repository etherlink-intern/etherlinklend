#!/usr/bin/env python3
"""Report the SPDX licenses reachable from each deployable component.

Walks the transitive Solidity import graph from the components frozen in
docs/adr/0003-first-launch-component-scope.md and prints the SPDX identifier of
every file reached. Used to answer one question: does any copyleft license we
do not intend to ship reach a contract we actually deploy?

Exits non-zero if a disallowed license appears in a deployable closure, or if
an import cannot be resolved, so this can be wired into CI later.

Run from the repository root, with submodules initialised:

    python3 tools/license/closure.py
"""

import os
import re
import sys

# Entry points frozen by ADR 0003. The oracle is the reference implementation;
# Phase 3 may select a different one, in which case update this list.
ENTRY_POINTS = [
    ("Morpho singleton", "lib/morpho-blue/src/Morpho.sol"),
    ("AdaptiveCurveIrm", "lib/morpho-blue-irm/src/adaptive-curve-irm/AdaptiveCurveIrm.sol"),
    ("MorphoChainlinkOracleV2", "lib/morpho-blue-oracles/src/morpho-chainlink/MorphoChainlinkOracleV2.sol"),
]

# Licenses permitted in a deployable artifact. Anything else is a finding:
# AGPL-3.0 in particular carries a network-use obligation we do not intend to
# take on. See docs/license-review.md Finding 1.
ALLOWED = {"GPL-2.0-or-later", "MIT"}

IMPORT_RE = re.compile(r"""import\s+(?:\{[^}]*\}\s*from\s*)?["']([^"']+)["']""")
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


def main():
    root = os.getcwd()
    remappings = read_remappings(root)
    unresolved, violations = [], []

    for name, entry in ENTRY_POINTS:
        if not os.path.isfile(entry):
            print(f"SKIP {name}: {entry} not found (run git submodule update --init --recursive)")
            continue
        files = closure(entry, root, remappings, unresolved)
        by_license = {}
        for path in files:
            by_license.setdefault(spdx_of(path), []).append(path)

        print(f"\n{name}  ({len(files)} files)")
        for license_id in sorted(by_license):
            paths = by_license[license_id]
            flag = "" if license_id in ALLOWED else "   <-- NOT ALLOWED IN A DEPLOYABLE ARTIFACT"
            print(f"  {license_id:24s} {len(paths):3d} file(s){flag}")
            if license_id not in ALLOWED:
                violations.extend(paths)
                for path in sorted(paths):
                    print(f"      {os.path.relpath(path, root)}")

    if unresolved:
        print("\nUnresolved imports (closure is incomplete, result is not trustworthy):")
        for path in sorted(set(unresolved)):
            print(f"  {path}")

    if violations or unresolved:
        print("\nFAIL")
        return 1
    print("\nOK: every deployable closure is within " + ", ".join(sorted(ALLOWED)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
