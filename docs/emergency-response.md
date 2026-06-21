# Emergency Response

## Severity Levels

- Critical: live fund loss or immediate exploitability.
- High: serious vulnerability with plausible fund-loss path.
- Medium: limited impact or requires special conditions.
- Low: non-critical correctness, documentation, or process issue.

## Response Roles

Placeholders that MUST be replaced before mainnet:

| Role | Owner | Backup | Notes |
|---|---|---|---|
| Incident commander | TODO | TODO | Coordinates response. |
| Protocol engineer | TODO | TODO | Investigates protocol and market behavior. |
| Security engineer | TODO | TODO | Reproduction, severity, mitigation review. |
| Communications owner | TODO | TODO | User and partner updates. |
| Multisig signers | TODO | TODO | If controls exist, coordinate safe action. |
| Legal/compliance contact | TODO | TODO | Disclosure, safe harbor, regulatory review. |

## First-Hour Checklist

Within the first hour of a credible report:

- Confirm report and preserve original evidence.
- Identify affected markets.
- Preserve logs, transactions, RPC traces, and indexer data.
- Check oracle status.
- Check abnormal events.
- Check bad debt and near-bad-debt indicators.
- Disable frontend market visibility if appropriate.
- Coordinate with multisig/signers if controls exist.
- Notify relevant partners if necessary.
- Assign next update time and channel.

## Morpho-Specific Considerations

Some Morpho Blue components may be immutable. Emergency response may depend on market-level controls, frontend controls, vault controls, curation controls, oracle actions, or external communication rather than pausing core contracts.

Do not imply a pause function exists unless confirmed in the actual deployed component.

## User Communication Template

```text
Status: Investigating

We are investigating an issue affecting: <affected markets or "to be confirmed">.

Current known impact: <known impact or "not yet confirmed">.

User action guidance: <specific action, or "no action guidance is available yet">.

Next update: <time and channel>.

Notes: We will avoid speculation until the affected markets, root cause, and mitigation path are confirmed.
```

## Postmortem Requirements

Every critical or high incident MUST produce a postmortem with:

- Timeline.
- Root cause.
- Affected markets.
- Impact.
- Mitigations.
- Test gaps.
- Monitoring gaps.
- Follow-up owners.
- Target dates.

## Blocking TODOs

- Owner: TODO operations lead. Action: assign incident roles and backups. Date: TODO before Shadownet deployment.
- Owner: TODO legal/compliance contact. Action: review disclosure and safe-harbor language. Date: TODO before mainnet.
