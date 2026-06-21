# Fork Policy

- No protocol changes without a fork-diff audit.
- All upstream changes must be tracked by commit SHA.
- Any deviation from upstream must be documented in `docs/diffs/` with rationale and reviewer sign-off.
- Diffs must be small, reviewed, tested, fuzzed, and audited.
- Protocol logic changes require dedicated unit, fork, invariant, and external review before deployment.
