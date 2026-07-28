# ADR 0003: First-Launch Component Scope

## Status

Proposed. Requires release-owner and protocol-engineer acceptance before it
gates Shadownet deployment.

This ADR closes the Phase 1 checklist item "define whether we deploy only
Morpho core, periphery, or additional helper contracts". ADR 0001 selected
Morpho Blue isolated markets; ADR 0002 selected Etherlink. Neither said which
contracts are actually deployed. This ADR freezes that list.

## Decision

The first Etherlink launch deploys exactly four things:

| # | Component | Source at pinned SHA | Constructor | Notes |
|---|---|---|---|---|
| 1 | `Morpho` singleton | `lib/morpho-blue/src/Morpho.sol` | `address newOwner` | One per chain. Immutable. Owner MUST be the launch multisig. |
| 2 | Exactly one IRM: `AdaptiveCurveIrm` | `lib/morpho-blue-irm/src/adaptive-curve-irm/AdaptiveCurveIrm.sol` | `address morpho` | Requires `enableIrm` by owner. |
| 3 | Exactly one oracle contract | Deferred to Phase 3 | Deferred | The slot is frozen to a single `IOracle` implementation; the implementation is NOT frozen by this ADR. |
| 4 | Exactly one LLTV value | N/A (owner call) | N/A | Enabled via `enableLltv`. Value deferred to Phase 2 risk approval. |

No other contract is deployed to Etherlink mainnet for the first launch.

### Explicitly Out Of Scope For First Launch

These MUST NOT be deployed to mainnet without a separate ADR, design review,
and security review:

- MetaMorpho or any ERC-4626 vault/curation layer.
- Public Allocator or any rebalancing layer.
- Bundler, Bundler3, or bundler adapters.
- Universal Rewards Distributor.
- Pre-liquidation contracts.
- `FixedRateIrm` (present in the pinned IRM submodule; not a production
  component for this launch).
- `WstEthStEthExchangeRateChainlinkAdapter` (not applicable to a WXTZ/USDC
  market).
- `MorphoChainlinkOracleV2Factory`. The factory is **out of scope**, with no
  exception. If Phase 3 wants the factory deployment path it must amend this
  ADR to list both the factory and the oracle it creates, and propagate the
  expanded list to `docs/architecture.md` — a factory path deploys **two**
  contracts, which contradicts the "exactly one oracle contract" freeze above.
  That is an amendment, not a permitted variation.
- Anything under `lib/morpho-blue/src/mocks/`.
- Anything under `src/testnet/` (`TestOnlyFixedPriceOracle`,
  `TestOnlyMockERC20`). These are Shadownet-only and MUST NOT reach mainnet.
- Any modification to upstream protocol logic. Per `docs/fork-policy.md`, a
  protocol-logic diff requires external audit coverage before production.

A second market, a second IRM, or a second LLTV is not in first-launch scope.
Each is a separate risk decision under Phase 10's next-market review.

## Verified Protocol Constraints

Checked against the pinned Morpho Blue source, not upstream documentation.
Commands are in the Verification section below. These constraints shape the
launch plan and are not optional design preferences.

### 1. Market creation is permissionless

`Morpho.createMarket()` is `external` with no access control. It requires only
that the IRM and the LLTV are already enabled:

```solidity
function createMarket(MarketParams memory marketParams) external {
    require(isIrmEnabled[marketParams.irm], ErrorsLib.IRM_NOT_ENABLED);
    require(isLltvEnabled[marketParams.lltv], ErrorsLib.LLTV_NOT_ENABLED);
    ...
}
```

Consequence: once we enable `AdaptiveCurveIrm` and one LLTV, **any address can
create any market** pairing that IRM and LLTV with arbitrary loan tokens,
collateral tokens, and oracles. We cannot prevent third-party markets, and we
cannot prevent a market that reuses our token pair with a hostile oracle.

What we actually control is narrow: which IRM addresses exist, which LLTV
values exist, and which market ID we endorse, monitor, support in the
frontend, and run liquidation infrastructure for.

This makes market-ID whitelisting a launch requirement rather than a
nice-to-have. `docs/monitoring.md` MUST alert on any market sharing our loan
or collateral token that is not our approved market ID.

### 2. Enabling is irreversible

There is no `disableIrm` and no `disableLltv`. The complete owner surface is:

```
setOwner, enableIrm, enableLltv, setFee, setFeeRecipient
```

Consequence: every `enableIrm`/`enableLltv` call is permanent for the life of
the deployment and permanently widens the set of markets anyone can create.
Each enable is therefore its own launch gate requiring risk-owner approval,
and the launch MUST enable the minimum: one IRM, one LLTV.

### 3. There is no pause

`Morpho.sol` contains no pause or freeze function. `docs/emergency-response.md`
currently hedges this ("do not imply a pause function exists unless confirmed
in the actual deployed component"). For the frozen scope above, it is now
confirmed: **no pause exists**.

Consequence: incident response cannot stop the protocol. The available levers
are frontend delisting, user communication, oracle-level action where the
oracle is ours and has controls, liquidation-side response, and off-chain cap
and curation controls. Emergency planning MUST be written against that
reality.

### 4. Fee is bounded but non-zero-risk

`setFee` is owner-only and bounded by `MAX_FEE = 0.25e18` (25%) in
`ConstantsLib`. The launch position is fee = 0 with `feeRecipient` unset until
a separate decision; any change is a multisig action and a monitored event.

### 5. Stateful IRM initialization at market creation

`createMarket` calls `IIrm(marketParams.irm).borrowRate(marketParams, market[id])`
when the IRM is non-zero, so IRM state is initialized at creation time. The
Shadownet rehearsal MUST exercise this path rather than assume it is inert.

### 6. Signature domain is bound to the deploy-time chain ID

The `DOMAIN_SEPARATOR` is computed in the constructor from `block.chainid` and
stored immutably. `setAuthorizationWithSig` therefore always hashes against the
**deploy-time** chain ID, not the current one.

If Etherlink's chain ID ever changes, the consequences run in the opposite
direction to the intuitive one:

- Signatures produced **before** the change **keep validating**, because the
  contract still hashes against the original domain. They do not expire.
- Signatures produced **after** the change by clients using the **new** chain
  ID **fail**, because the client and the contract now disagree on the domain.

The risk to plan for is therefore **cross-fork signature replay** — an
authorization signed on one side of a chain-ID split remains valid against this
deployment — not signature expiry. This is a note for the Etherlink readiness
gate, not a defect.

## Consequences

- Monitoring scope grows: we must watch markets we do not own.
- The multisig is not an emergency brake. Emergency response is limited to
  the levers in constraint 3.
- Minimizing enables is a security control, not tidiness — each enable is
  permanent.
- Deferring the oracle (Phase 3) and LLTV (Phase 2) keeps this ADR
  reviewable now without pre-empting those gates.
- The placeholder deployment scripts described in `script/README.md` can now
  be written against a definite component list under Phase 4.

## Verification

```bash
git -C lib/morpho-blue rev-parse HEAD
sed -n '/function createMarket/,/^    }/p' lib/morpho-blue/src/Morpho.sol
grep -nB1 'onlyOwner' lib/morpho-blue/src/Morpho.sol | grep function
grep -icE 'pause|freeze' lib/morpho-blue/src/Morpho.sol   # expect 0
grep -n 'MAX_FEE' lib/morpho-blue/src/libraries/ConstantsLib.sol
```

## Verification TODO

- Owner: TODO protocol engineer. Action: confirm the four in-scope components
  against the official Morpho deployment reference once `docs/upstream.md`
  records it. Date: TODO before Shadownet deployment.
- Owner: TODO risk owner. Action: approve the single-IRM, single-LLTV launch
  position. Date: TODO before Shadownet market creation.
- Owner: TODO monitoring owner. Action: implement duplicate-market alerting
  required by constraint 1. Date: TODO before mainnet market visibility.
