# Release Process

## Release Types

- Documentation-only.
- Testnet deployment.
- Mainnet deployment.
- Parameter update.
- Upstream dependency update.

Each release type MUST document scope, approvals, tests, and residual risk.

## Release Requirements

Every release SHOULD include:

- Changelog.
- Upstream SHA.
- Diff summary.
- Tests.
- Security review.
- Deployment artifacts, if any deployment occurred.
- Approvals.

Dependency updates MUST include upstream diff review and license review.

## Mainnet Release Hard Blockers

Mainnet release MUST NOT proceed with:

- Unresolved critical findings.
- Unresolved high findings.
- Missing oracle verification.
- Missing risk approval.
- Missing deployment artifacts.
- Placeholder addresses.
- Unverified contracts.
- Missing emergency contacts.
- Missing monitoring.
- Missing liquidation readiness.
- Unclear license status.

## Post-Release

After release:

- Monitor the first 24 hours.
- Verify events.
- Verify frontend/indexer behavior.
- Verify liquidation bot operation.
- Verify alerts.
- Publish a deployment summary if appropriate.

## Blocking TODOs

- Owner: TODO release owner. Action: define release approvers and required evidence per release type. Date: TODO before Shadownet deployment.
