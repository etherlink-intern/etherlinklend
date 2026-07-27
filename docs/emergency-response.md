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

For the frozen first-launch scope in
[ADR 0003](adr/0003-first-launch-component-scope.md), this is now confirmed
against the pinned source: **`Morpho.sol` has no pause or freeze function.**
The complete owner surface is `setOwner`, `enableIrm`, `enableLltv`, `setFee`,
and `setFeeRecipient`, and there is no `disableIrm` or `disableLltv`.

The multisig is therefore not an emergency brake. Incident response for the
first launch is limited to:

- Frontend delisting and user-facing warnings.
- User and partner communication.
- Oracle-level action, only where the oracle is ours and has controls. The
  oracle is selected in Phase 3; whether it has any emergency control is a
  Phase 3 requirement, not an assumption.
- Liquidation-side response, including funding and prioritizing liquidators.
- Off-chain cap and curation controls.

Any incident plan that assumes borrowing can be halted on-chain is invalid for
this scope.

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
