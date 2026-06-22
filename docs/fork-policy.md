# Fork Policy

## Principle

Upstream code MUST remain pinned, auditable, and minimally modified. Any fork diff is a liability until reviewed, tested, and approved.

The Etherlink Morpho deployment SHOULD preserve upstream Morpho Blue protocol logic unless a specific, documented, audited reason exists to change it.

## Upstream Pinning

- Every upstream dependency MUST be pinned by commit SHA.
- Floating branches are forbidden for production.
- `docs/upstream.md` MUST document repository URL, commit SHA, license, usage, local path, status, and notes.
- Submodule SHAs MUST be reviewed before release.
- Dependency updates MUST go through pull request review and security review.

## Allowed Changes Before Audit

The following changes MAY be made before an external audit if they do not alter protocol logic:

- Documentation.
- Config templates.
- Deployment scripts that do not alter protocol logic.
- Test harnesses.
- Local mocks.
- Chain configuration.
- Risk, oracle, and market review templates.

## Restricted Changes

The following changes require explicit protocol review, security review, and external audit before production:

- Accounting math.
- Share/asset conversion logic.
- Liquidation logic.
- Oracle logic.
- Interest-rate model logic.
- Token transfer handling.
- Authorization.
- Market-creation rules.
- Fee logic.
- Any change that affects balances, collateralization, health checks, liquidation eligibility, or oracle interpretation.

## Diff Process

Every production-impacting fork diff MUST follow this process:

1. Generate a diff against the exact upstream commit.
2. Classify each change as documentation, configuration, scripts, tests, periphery, or protocol logic.
3. Map each change to unit tests, fork tests, fuzz tests, invariant tests, or manual review evidence.
4. Review by a protocol engineer.
5. Review by a security engineer.
6. Obtain external audit coverage for production-impacting changes.
7. Record final approval and known residual risk in the release notes.

## Upgrade Policy

Upstream upgrades MUST be treated as new security events. They are not routine dependency bumps.

Upstream updates MUST NOT be merged blindly. The release owner MUST:

- Compare old and new upstream SHAs.
- Review upstream changelogs and audit notes.
- Run the full regression suite.
- Run invariant and fork tests.
- Run static analysis.
- Re-check license and attribution requirements.
- Re-review affected deployment and market configs.

## Release Gating

No release MAY proceed if:

- An upstream SHA is missing.
- License status is unclear.
- High or critical security findings remain unresolved.
- Deployment configs contain placeholders.
- Oracle feed IDs or token addresses are unverified.
- A fork diff has not been reviewed.
- Production-impacting changes have not received external audit coverage.
