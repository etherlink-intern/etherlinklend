# Etherlink Shadownet Runbook

## Operator Prerequisites

- Foundry installed.
- Repo dependencies installed.
- Submodules initialized.
- Fresh testnet deployer wallet prepared.
- Shadownet XTZ obtained from `https://shadownet.faucet.etherlink.com/`.
- `.env.shadownet` created locally but not committed.
- `ETHERLINK_SHADOWNET_RPC_URL` set.
- `PRIVATE_KEY` set locally only when broadcasting.
- `DEPLOYER_ADDRESS` set locally.
- `CONFIRM_SHADOWNET_DEPLOYMENT=false` for dry runs.
- `CONFIRM_SHADOWNET_DEPLOYMENT=true` only for actual Shadownet broadcast.

## Preflight Commands

```bash
git status
git submodule status --recursive
forge --version
forge build
forge test
cast chain-id --rpc-url "$ETHERLINK_SHADOWNET_RPC_URL"
cast balance "$DEPLOYER_ADDRESS" --rpc-url "$ETHERLINK_SHADOWNET_RPC_URL"
make preflight-shadownet
```

## Dry-Run Commands

```bash
make build
make test
make dry-run-shadownet
```

For local Anvil dry runs, start Anvil with chain ID `127823` and use a local RPC URL. Do not broadcast to mainnet.

## Broadcast Commands

Shadownet only:

```bash
source .env.shadownet
export CONFIRM_SHADOWNET_DEPLOYMENT=true
make deploy-mocks-shadownet
make deploy-core-shadownet
make deploy-irm-oracle-shadownet
make create-market-shadownet
make smoke-test-shadownet
make record-shadownet
```

The scripts revert unless `block.chainid == 127823`. The Make targets also require `CONFIRM_SHADOWNET_DEPLOYMENT=true`.

## Verification Commands

```bash
make verify-shadownet
```

Then follow `docs/shadownet-verification.md` for each deployed contract.

## Smoke-Test Commands

```bash
make smoke-test-shadownet
```

Smoke tests are safe only for the mock/test-only market.

## Artifact Recording

```bash
export SHADOWNET_RUN_ID="$(date -u +%Y%m%d-%H%M%S)"
export GIT_BRANCH="$(git branch --show-current)"
export GIT_COMMIT="$(git rev-parse HEAD)"
export UPSTREAM_MORPHO_BLUE_COMMIT="$(git -C lib/morpho-blue rev-parse HEAD)"
make record-shadownet
```

Artifacts are written to `deployments/etherlink-shadownet/`.

## Failure Handling

- Failed deployment: stop, record failed command, error summary, tx hash if any, and deployed partial addresses.
- Failed verification: do not mark success; retry only after constructor/compiler mismatch checks.
- Wrong chain ID: stop immediately.
- Insufficient XTZ: fund the testnet deployer from the faucet, then rerun preflight.
- RPC rate limit: switch to a reliable Shadownet RPC.
- Constructor mismatch: compare source constructor args and deployment transaction input.
- Market creation failure: check enabled IRM, enabled LLTV, borrow rate, oracle price, and address code.
- Smoke-test failure: stop and preserve state; do not continue to public testing.

## Post-Deployment Checks

- Explorer links resolve.
- Contract code is present.
- Market params match config.
- Mock token balances are expected.
- Oracle price returns expected `1e36` value.
- Supply, borrow, repay, and withdraw path works.
- Liquidation path tested if practical with a controlled unhealthy position.

## Mainnet Warning

No mainnet deployment is in scope. Shadownet success does not imply mainnet safety.
