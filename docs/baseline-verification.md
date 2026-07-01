# Baseline Verification

This file records the current project baseline for the launch checklist. It is
not production approval. It is the evidence record for PR 0B in issue #25.

## Evidence Entry

```text
Evidence ID: 20260701-baseline-verification
Checklist item(s): Phase 0 - Confirm repo builds cleanly; Confirm frontend/NOC dashboard runs; Confirm CI passes
Status: IN PROGRESS
Owner: protocol engineer
Due gate: Every PR and before each deployment rehearsal
Evidence source: docs/baseline-verification.md
Validation: local JS checks plus GitHub CI on main
Result: pass for available local JS checks and GitHub CI; local Foundry blocked by missing forge executable
Reviewer: release owner
Decision: needs follow-up before marking launch checklist items DONE
Follow-up: install or expose Foundry locally, or continue using GitHub CI as Foundry evidence until that is fixed
```

## Repository State

- Branch used for baseline collection: `codex/baseline-verification-note`.
- Base commit: `5c2b276e17dd3dc6894b271cdffc7253f273e013`.
- Base commit source: merge of PR #26 into `main`.
- Dirty worktree after local verification: no.

## Local Tool State

| Tool | Command | Result |
|---|---|---|
| Node.js | `node --version` | `v22.22.3` |
| npm | `npm --version` | `10.9.8` |
| pnpm through Corepack | `corepack pnpm --version` | `10.28.1` |
| bare pnpm | `pnpm --version` | blocked: `command not found` |
| Foundry | `forge --version` | blocked: `command not found` |

Use `corepack pnpm ...` for local pnpm commands in this shell unless `pnpm` is
added to PATH. Foundry-backed local checks require installing Foundry or adding
the existing Foundry binary to PATH.

## Local Verification

| Check | Command | Result | Notes |
|---|---|---|---|
| Solidity lint | `corepack pnpm lint` | pass | Solhint exits 0 but prints the existing warning that rule `use-natspec` does not exist. |
| Oracle monitor unit tests | `corepack pnpm test:oracle-monitor` | pass | Prints `oracle monitor unit tests passed`. |
| Frontend/NOC dashboard build | `npm --prefix etherlinklend run build` | pass | Vite build completed successfully. |
| Local Foundry format/build/test | `forge fmt --check`, `forge build`, `forge test` | blocked locally | `forge` is not on PATH in this shell. Use GitHub CI as current Foundry evidence. |

## GitHub CI Evidence

Latest `main` runs after PR #26 merged:

| Workflow | Run | Result | Commit |
|---|---|---|---|
| CI | https://github.com/etherlink-intern/etherlinklend/actions/runs/28500550101 | success | `5c2b276e17dd3dc6894b271cdffc7253f273e013` |
| CodeQL | https://github.com/etherlink-intern/etherlinklend/actions/runs/28500550143 | success | `5c2b276e17dd3dc6894b271cdffc7253f273e013` |
| Slither | https://github.com/etherlink-intern/etherlinklend/actions/runs/28500550109 | success | `5c2b276e17dd3dc6894b271cdffc7253f273e013` |

The CI workflow covers:

- `pnpm install --frozen-lockfile`
- `git submodule update --init --recursive`
- `forge fmt --check`
- `forge build`
- `forge test`
- `forge snapshot --check || forge snapshot`
- `pnpm lint`

## Baseline Follow-Ups

- Add or document a local Foundry installation path so operators can reproduce
  CI Foundry checks locally.
- Add `pnpm` to PATH or consistently document `corepack pnpm` as the local
  entrypoint.
- Decide whether the Solhint `use-natspec` warning should be fixed in a later
  config cleanup PR.
- Do not mark launch-checklist build/test checkboxes as `DONE` until the release
  owner accepts GitHub CI as sufficient evidence or local Foundry reproduction is
  available.
