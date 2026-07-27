# Market Risk Memo: WXTZ / USDC (First Market Candidate)

Status: **proposal for risk-owner decision. Not an approval.**

Proposes initial LLTV, IRM direction, caps, and explicit approve/reject
criteria for the first Etherlink Morpho market, derived from the measured
liquidation depth in
[wxtz-due-diligence.md](wxtz-due-diligence.md) and
[usdc-due-diligence.md](usdc-due-diligence.md), and from the protocol
constraints frozen in
[ADR 0003](../../docs/adr/0003-first-launch-component-scope.md).

Market shape: **collateral WXTZ, loan asset bridged USDC**, one isolated
Morpho Blue market.

## Finding 0 — Caps Are Not Enforceable In The Frozen Scope

This must be settled before any cap number is discussed, because it changes
what a "cap" means in this repository.

**Morpho Blue core has no supply or borrow cap.** Verified against the pinned
source: `supply()` performs no cap check, and the string `cap` does not appear
anywhere in `Morpho.sol`. Caps in the Morpho ecosystem are a **MetaMorpho
vault** feature, and ADR 0003 explicitly excludes any vault layer from the
first launch.

Combined with ADR 0003 Finding 1 (market creation is permissionless), the
position is:

- Anyone can supply to our market, in any amount, at any time.
- Anyone can borrow up to the LLTV, in any amount, at any time.
- We cannot stop either. There is no pause.

Therefore every cap in this memo and in the accompanying market config is an
**advisory monitoring threshold and exposure policy — not an enforced limit.**
The market config field names (`maxSupplyCap`, `initialSupplyCap`) come from
the repository template and would otherwise imply an enforcement that does not
exist; the config records this explicitly.

The three honest options:

1. **Launch uncapped and monitor.** Accept that a third party can push the
   market past safely-liquidatable size. Mitigation is alerting, frontend
   warnings, and communication. No on-chain lever.
2. **Add a MetaMorpho vault layer** so supply caps become real. This is
   excluded by ADR 0003 and would require a new ADR, design review, and audit.
   It also enlarges the deployed surface considerably.
3. **Delay the market** until executable depth is large enough that being
   oversupplied is not dangerous.

Engineering recommends the risk owner treat this as the **primary** launch
decision. The LLTV and cap numbers below matter far less than this choice.

## Liquidation Economics

Morpho computes the liquidation incentive factor from the pinned source as:

```solidity
// The liquidation incentive factor is min(maxLiquidationIncentiveFactor, 1/(1 - cursor*(1 - lltv))).
```

with `LIQUIDATION_CURSOR = 0.3e18` and `MAX_LIQUIDATION_INCENTIVE_FACTOR = 1.15e18`.

| LLTV | Liquidation incentive |
|---:|---:|
| 0.385 | 15.00% (at the 1.15 ceiling) |
| 0.625 | 12.68% |
| 0.770 | 7.41% |
| 0.860 | 4.38% |
| 0.915 | 2.62% |
| 0.945 | 1.68% |

A liquidator acts only when `incentive > slippage + gas + margin`. Against the
measured WXTZ → USDC curve:

| Liquidation size | Slippage | Viable at LLTV 0.625 (12.68%) | at 0.77 (7.41%) | at 0.86 (4.38%) | at 0.915 (2.62%) |
|---:|---:|:--:|:--:|:--:|:--:|
| 10,000 WXTZ | 0.05% | yes | yes | yes | yes |
| 25,000 WXTZ | 0.51% | yes | yes | yes | yes |
| 30,000 WXTZ | 2.25% | yes | yes | marginal | **no** |
| 40,000 WXTZ | 21.06% | **no** | **no** | **no** | **no** |

### The depth curve is a cliff, so LLTV barely moves the safe market size

This is the memo's central quantitative point. Because slippage jumps from
2.25% to 21.06% between 30,000 and 40,000 WXTZ, the maximum safely
liquidatable size lands between **26,000 and 35,000 WXTZ for every LLTV
considered**. Choosing a lower LLTV buys almost no additional liquidatable
size.

The consequence is that **LLTV should be selected for volatility protection,
not for liquidation economics.** The liquidation constraint is set by depth
and is essentially fixed regardless of the LLTV we pick.

## Recommendation: LLTV

**Proposed: `0.625` (62.5%), expressed as `625000000000000000` in WAD.**

Rationale:

1. **Volatility buffer.** XTZ is a volatile asset against a dollar-denominated
   loan. A 37.5% buffer is appropriate for a first market on a new chain with
   an unproven liquidation path.
2. **Best liquidator incentive available at a sane LLTV.** 12.68% gives the
   widest margin over slippage, which matters most precisely when it is worst
   — in stressed conditions, where the calm-market curve above understates
   slippage.
3. **Enabling an LLTV is permanent.** Per ADR 0003 Finding 2, there is no
   `disableLltv`. Whatever we enable exists forever and permanently widens the
   set of markets anyone can create at that LLTV. Starting conservative is the
   only reversible-by-addition direction: a higher LLTV can be enabled later,
   but a mistake cannot be withdrawn.
4. The capital-efficiency cost is negligible for a market whose safe size is
   low five figures of dollars.

Explicitly **not** recommended: 0.86 or above. At 0.86 the incentive is 4.38%
and a 30,000 WXTZ liquidation at 2.25% slippage leaves ~2.1% for gas and
liquidator margin before the liquidation stops being worth doing.

**Enable exactly one LLTV.** Do not enable a range "for future flexibility" —
each enable is permanent and permissionlessly usable by anyone.

## Recommendation: IRM

**Proposed: `AdaptiveCurveIrm`**, the single IRM frozen by ADR 0003, at
upstream default parameters.

Notes for the risk owner:

- The adaptive curve targets a utilization level and moves the rate over time
  toward it. In a market this small, utilization will be erratic — a single
  supplier or borrower can swing it — so the rate will be noisy early on. That
  is expected, not a malfunction.
- `createMarket` calls `borrowRate` on the IRM at creation, so IRM state is
  initialized at market creation. The Shadownet rehearsal must exercise this.
- `FixedRateIrm` exists in the pinned submodule and is explicitly out of scope
  per ADR 0003. It is currently referenced by
  `script/shadownet/03_DeployIRMAndOracle.s.sol` for Shadownet only; that is a
  testnet path and must not be carried to mainnet.

## Recommendation: Caps (Advisory Only — See Finding 0)

Derived from the measured <1% slippage band, not from a target market size.

| Parameter | Proposed | Basis |
|---|---:|---|
| Advisory initial supply cap | **25,000 WXTZ** (~$5,175) | Full-market unwind stays inside 0.51% slippage |
| Advisory initial borrow cap | **3,000 USDC** | 25,000 × $0.207 × 0.625 ≈ $3,234 max borrowable; rounded down |
| Advisory maximum supply cap | **30,000 WXTZ** | Last size before the cliff; requires re-measured depth to reach |
| Hard stop | **35,000 WXTZ** | Beyond this, no LLTV yields viable liquidation |

Enforcement, stated plainly: **none of these are enforced on-chain.** They are
enforced by (a) us being the only intended supplier at launch, (b) monitoring
alerts when thresholds are crossed, and (c) frontend and communications
controls. Ownership of each control must be named before launch.

### Cap ratchet

Caps increase only on evidence, never on schedule:

1. Market stable for **14 consecutive days** with no oracle, liquidation, or
   bad-debt incident.
2. Executable depth **re-measured** on at least two independent routers, plus
   direct pool reserves.
3. At least one **real liquidation** observed and cleared profitably, or a
   Shadownet rehearsal of an equivalent size.
4. New cap keeps full-market unwind inside **1%** slippage at the re-measured
   depth.
5. Risk-owner sign-off recorded in this file.

Any increase without all five is a process violation.

## Approve / Reject Criteria

These are the concrete tests the risk owner should apply. They are written so
the answer is checkable rather than a matter of judgment.

### Reject, or defer, if any of the following holds

- Executable depth at ≤1% slippage is **below 20,000 WXTZ** when re-measured.
- Slippage at the advisory supply cap exceeds **half** the liquidation
  incentive for the chosen LLTV.
- Depth measured on a second independent router disagrees with the Kyber curve
  by more than **25%** at the 25,000 WXTZ point.
- The oracle staleness threshold cannot be bounded from an observed update
  cadence (Phase 3).
- No liquidation has been executed end-to-end on Shadownet.
- The shared 2-of-3 multisig trust root (WXTZ Finding 2 / USDC Finding 2) is
  not explicitly accepted in writing.
- Finding 0 is unresolved — i.e. the market would launch with no answer to
  "what happens when a third party supplies past the safe size".

### Approve only if all of the following hold

- All four blocking items in each asset due-diligence file are closed.
- Provenance cited for the WXTZ address, the USDC address, and the bridge.
- Depth re-measured on two routers plus pool reserves, within the ratchet
  criteria above.
- Liquidation rehearsed on Shadownet, including an intentionally unhealthy
  position.
- Oracle selected, scaled, and failure-mode tested per Phase 3.
- Monitoring live for: approved market ID whitelist, duplicate markets,
  `ProposePeer`/`PeerSet`/`OwnershipTransferred` on WXTZ, bridge ownership and
  trusted-remote changes, bridged-USDC peg, and DEX route health.
- Named owners recorded for every advisory cap control.
- Risk owner records the Finding 0 decision.

## Oracle Scaling Note For Phase 3

Recorded here because it is a frequent source of error and is determined by
this market's decimals, not by the oracle choice.

Morpho's `ORACLE_PRICE_SCALE` is `1e36`, and `liquidate` computes
`seizedAssetsQuoted = seizedAssets.mulDivUp(collateralPrice, ORACLE_PRICE_SCALE)`
where `seizedAssets` is in collateral units and the result is in loan units.

For collateral WXTZ (18 dp) and loan USDC (6 dp), the oracle must therefore
return the WXTZ price in USDC scaled by:

```
36 + loanDecimals - collateralDecimals = 36 + 6 - 18 = 24 decimals
```

At the review price of ~0.2069 USDC per WXTZ, `price()` must return
approximately **`2.069e23`**. Any oracle adapter delivered in Phase 3 MUST be
unit-tested against this exact expectation.

## Blocking TODOs

- Owner: TODO risk owner. Action: decide Finding 0 — launch uncapped and
  monitor, add a vault layer, or delay. Date: TODO before Shadownet market
  creation.
- Owner: TODO risk owner. Action: approve or amend the proposed LLTV of 0.625
  and confirm that exactly one LLTV will be enabled. Date: TODO before
  Shadownet market creation.
- Owner: TODO risk owner. Action: name the owner of each advisory cap control.
  Date: TODO before mainnet market visibility.
- Owner: TODO protocol engineer. Action: re-measure depth on a second router
  and direct pool reserves. Date: TODO before market approval.
- Owner: TODO oracle reviewer. Action: implement and test the 1e24-scaled
  WXTZ/USDC oracle output. Date: TODO Phase 3.
