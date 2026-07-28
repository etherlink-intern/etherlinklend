# Asset Due Diligence: WXTZ (Collateral Candidate)

Status: **technical review complete, risk-owner approval outstanding.**

All on-chain values in this document were read directly from Etherlink mainnet
(chain ID `42793`, verified via `eth_chainId` = `0xa729`) at approximately
block **49,494,673** on **2026-07-27**. Commands are in the Verification
section. Prices are point-in-time and will move; the structural findings will
not.

## Asset Identity

- Name: `Wrapped XTZ` (read from `name()`)
- Symbol: `WXTZ` (read from `symbol()`)
- Address: `0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb`
- Chain: Etherlink Mainnet (`42793`)
- Issuer/bridge: LayerZero OFT, owned by a 2-of-3 Gnosis Safe (see Control)
- Decimals: **18** (read from `decimals()`) — matches
  `config/oracles/etherlink-price-sources.json`
- Total supply: 7,310,720.54 WXTZ
- Official address source: **still required.** The address matches the value
  already in `etherlink-price-sources.json`, and the contract self-reports as
  WXTZ, but that is self-attestation, not provenance. An official Etherlink or
  issuer reference MUST be cited before approval.
- Contract verification: verified on Etherlink Blockscout, compiler
  `v0.8.22+commit.4fc1097e`, optimizer enabled, verified 2024-06-24.

## Contract Behavior

| Property | Finding | Evidence |
|---|---|---|
| Standard ERC-20 | **Yes** | OpenZeppelin ERC20 v5. Exactly one `_update` definition in the full verified source, unmodified — see Verification. |
| Upgradeable | **No proxy** | Blockscout reports `proxy_type: null`, `implementations: []`. EIP-1967 implementation, admin, and beacon slots all read zero. |
| Pausable | **No** | No `pause`/`paused` in the ABI. |
| Blacklistable | **No** | No blacklist function in the ABI. |
| Rebasing | **No** | `_update` unmodified; balances are plain storage. |
| Fee-on-transfer | **No** | `_update` unmodified; no fee logic on the ERC-20 transfer path. |
| Callback behavior | **No** | No ERC-777/ERC-677 hooks on `transfer`/`transferFrom`. |
| Permit support | **Yes** | EIP-2612: `permit`, `nonces`, `DOMAIN_SEPARATOR`, `eip712Domain` all present. |
| Known incidents | None found | No incident located for this contract. Absence of evidence only. |

For a Morpho market, the local transfer path is the part that matters most,
and it is clean: a standard, non-rebasing, non-fee, non-callback ERC-20 with
18 decimals. **The risk in this asset is not in `transfer`. It is in how the
supply is created.**

## Finding 1 — WXTZ Is A LayerZero OFT, Not Just A Wrapper

This resolves the "review WXTZ wrapper/OFT/bridge risk" item folded in from #2.
It is confirmed: WXTZ is **both** a native-XTZ wrapper **and** an omnichain
fungible token.

Wrapper surface: `deposit() payable`, `withdraw(uint256)`, `Deposit` and
`Withdrawal` events.

OFT surface, from the verified ABI: `send`, `quoteSend`, `quoteOFT`,
`lzReceive`, `lzReceiveAndRevert`, `lzReceiveSimulate`, `setPeer`, `peers`,
`isPeer`, `endpoint`, `oApp`, `oftVersion`, `sharedDecimals`,
`decimalConversionRate`, `enforcedOptions`, `msgInspector`, `preCrime`,
`nextNonce`, plus `PeerSet`, `ProposePeer`, `OFTSent`, `OFTReceived` events.

Key parameters read on-chain:

| Parameter | Value | Meaning |
|---|---|---|
| `endpoint()` | `0xaab5a48cfc03efa9cc34a2c1aacccb84b4b770e4` | LayerZero endpoint |
| `token()` | itself | Native OFT, not a lockbox adapter |
| `approvalRequired()` | `false` | Confirms native OFT |
| `sharedDecimals()` | **6** | Cross-chain precision |
| `decimalConversionRate()` | **1e12** | Truncation unit on cross-chain send |
| `TIMELOCK()` | **172800** (48 hours) | Delay on peer changes |
| `etherlinkChainId()` | `42793` | Matches ADR 0002 |

Consequences:

1. **`lzReceive` mints WXTZ.** Local supply is not solely a function of XTZ
   deposited on Etherlink. A trusted remote peer can cause new WXTZ to exist
   here. A compromised or malicious peer chain can therefore mint WXTZ that is
   not backed by newly locked XTZ, and holders would redeem against the shared
   XTZ pool until it is drained.
2. **`setPeer` is owner-controlled but timelocked 48 hours**, with a
   `ProposePeer` event. That is a meaningful mitigation against silently
   adding a hostile peer, and it gives monitoring a 48-hour window to react.
   It does **not** protect against compromise of an already-trusted peer.
3. **Cross-chain transfers round down to 6 decimals, and the remainder stays
   with the sender.** With `decimalConversionRate = 1e12`, `_debitView` sets
   `amountSentLD = _removeDust(_amountLD)`, i.e.
   `(_amountLD / 1e12) * 1e12`. Only the rounded-down amount is debited, so the
   remainder is **not burned or lost** — it remains in the sender's local
   balance. The upstream comment states the intent directly: *"Remove the dust
   so nothing is lost on the conversion between chains."*

   This does **not** affect local Morpho supply/borrow/repay/withdraw, which
   use full 18-decimal transfers. It is still worth a Phase 5 test, but the
   invariant to assert is *sender balance is preserved to within one dust
   unit*, **not** *value is destroyed*. Specifying it the wrong way round would
   produce a test that fails against correct behaviour.

### Backing observed

| Quantity | Value |
|---|---|
| Native XTZ held by the contract | 8,872,408.55 XTZ |
| Local `totalSupply()` | 7,310,720.54 WXTZ |
| Surplus locked locally | +1,561,688.01 XTZ |

The contract holds **more** native XTZ than local WXTZ outstanding. This is
the expected shape for an OFT: WXTZ sent to other chains is burned locally
while the underlying XTZ stays locked here. It means local `totalSupply()`
**understates** total WXTZ in existence across all chains, so any risk model
keyed on local supply alone is measuring the wrong number.

## Finding 2 — Control Is A 2-Of-3 Multisig Shared With The Loan Asset

`owner()` = `0x90481dadc7163d984c4939691c113617fa27c383`.

That address is a **Gnosis Safe** (`GnosisSafeProxy` → `GnosisSafeL2`,
version 1.3.0) with:

- **Threshold: 2**
- **Owners: 3** — `0xc2dd6d8f...`, `0xc3a9d37f...`, `0xf479e227...`

Owner powers on WXTZ: `setPeer` (48h timelock), `setDelegate`,
`setEnforcedOptions`, `setMsgInspector`, `setPreCrime`, `transferOwnership`,
`renounceOwnership`.

**The same Safe owns the USDC bridge** — see the USDC due-diligence file. That
means one 2-of-3 multisig is the trust root for **both** the collateral asset
and the loan asset of the proposed first market. Two key compromises would
compromise both sides simultaneously. This is a correlated failure the
isolated-market design does **not** mitigate, because isolation bounds
contagion between markets, not shared dependencies inside one market.

The signer identities are not established here. Whether a 2-of-3 with unknown
signers is acceptable as the trust root for the first market is a risk-owner
decision.

## Liquidity

Measured against the KyberSwap aggregator on Etherlink at the review block.
One aggregator's routing view — it SHOULD be cross-checked against a second
router and against direct pool reserves before approval.

Reference prices at review time, three independent sources within 0.2%:

| Source | XTZ/USD |
|---|---|
| RedStone on-chain feed `0xe92c00BC...` | 0.20736041 (8 dp, 4 seconds old) |
| Pyth Hermes | 0.20726316 |
| Kyber executable, small size | ~0.2069 |

Executable WXTZ → USDC, priced against the ~0.2069 small-size executable rate:

The "input value" column below values the WXTZ **input** at the ~0.2069
reference rate. It is deliberately not the same as "USDC out" — the gap between
the two columns *is* the loss.

| WXTZ in | Input value ≈ USD | USDC out | Effective px | Slippage | Value destroyed |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 207 | 206.94 | 0.206940 | baseline | — |
| 5,000 | 1,035 | 1,034.39 | 0.206878 | −0.03% | ~0 |
| 10,000 | 2,069 | 2,068.29 | 0.206829 | −0.05% | ~1 |
| 15,000 | 3,104 | 3,100.55 | 0.206703 | −0.11% | ~3 |
| 20,000 | 4,138 | 4,129.48 | 0.206474 | −0.23% | ~9 |
| 25,000 | 5,173 | 5,146.88 | 0.205875 | −0.51% | ~26 |
| 30,000 | 6,207 | 6,068.18 | 0.202273 | **−2.25%** | **~139** |
| 40,000 | 8,276 | 6,533.80 | 0.163345 | **−21.06%** | **~1,742** |
| 50,000 | 10,345 | 6,310.38 | 0.126208 | **−39.01%** | **~4,035** |
| 100,000 | 20,690 | 5,823.42 | 0.058234 | **−71.86%** | **~14,867** |
| 250,000 | 51,725 | 1,710.23 | 0.006841 | **−96.69%** | **~50,015** |

Reverse direction (USDC → WXTZ) is flat at ~0.2073 through at least
10,000 USDC, so the thin side is the one that matters for liquidation:
**selling WXTZ collateral.**

Note the absolute output *falls* above 40,000 WXTZ — selling more returns
fewer USDC. There is no additional depth to reach.

### Finding 3 — Executable Depth Caps The Entire Market At Low Five Figures USD

The cliff sits between **30,000 and 40,000 WXTZ (~$6,200–$8,300)**. Below
~25,000 WXTZ slippage is under 1%; by 40,000 WXTZ it is 21%.

Compare against the liquidation incentive. Morpho Blue computes LIF as
`min(MAX_LIF, 1 / (BETA*LLTV + (1 - BETA)))` with `BETA = 0.3` and
`MAX_LIF = 1.15`. At an illustrative LLTV of 0.86 that is ≈ **4.4%**.

A liquidator only acts if `liquidation incentive > slippage + gas + margin`.
With a ~4.4% incentive, per **single** liquidation call:

- A liquidation of ≤ 25,000 WXTZ (~$5,170) is comfortably profitable.
- A liquidation of ~30,000 WXTZ (~$6,210) is marginal at 2.25% slippage
  before gas and liquidator margin.
- A single liquidation of ≥ 40,000 WXTZ (~$8,280) is **deeply unprofitable**
  at 21% slippage.

### Partial liquidation changes the shape of this, but not the conclusion

Morpho's `liquidate()` takes a caller-chosen `seizedAssets` or `repaidShares`,
so a liquidator facing a 40,000 WXTZ position is **not** forced to take it in
one trade. They can seize a profitable ~25,000 WXTZ slice and leave the rest.
The full-size quote above therefore does **not** by itself prove that no
liquidator acts, or that bad debt follows immediately — an earlier draft of
this file overstated that, and the claim is corrected here.

What the curve does establish:

- Each slice consumes depth, so successive slices in the same block face a
  worse curve. The table is a snapshot of one path, not a repeatable quote.
- Clearing a large position depends on **pool replenishment between slices**,
  i.e. on arbitrageurs restoring the pool from elsewhere. That is an external
  dependency, it takes time, and it is least reliable during the volatility
  that caused the liquidation.
- A partially liquidated position stays unhealthy in the interim, so the
  protocol carries the residual risk for however long replenishment takes.

So the honest statement is: positions materially above the ~25,000–30,000 WXTZ
band cannot be cleared **in one transaction** at a profit, and clearing them at
all depends on repeated slices plus timely replenishment. Sizing caps to the
single-slice band is the conservative choice, and it is what this file
recommends — but the supporting mechanism is sequential-liquidation risk, not
an absolute "nobody liquidates".

**Not yet measured, and required before approval:** a sequential-slice
simulation (repeated 25,000 WXTZ quotes against a decrementing pool) and an
estimate of replenishment time. Until then the caps below are conservative by
assumption rather than by measurement.

This measurement is taken in calm conditions. Liquidations happen in stressed
conditions, when depth is typically worse and correlated with the price move
that triggered the liquidation. The usable figure is therefore materially
below the calm-market number.

**This is the binding constraint on the whole market**, and it is tighter than
any parameter discussed so far. It directly triggers the standing instruction
in #25: *"Reduce caps or pause exposure growth when executable liquidity
cannot support the largest expected liquidation."*

## Oracle

Not selected here — Phase 3 owns that decision. Observed for this review:

- RedStone Chainlink-style feed at `0xe92c00BC72dD12e26E61212c04E8D93aa09624F2`
  responds to `latestRoundData()` and `decimals()`; **8 decimals**;
  `description()` = `"Redstone Price Feed"`; answer `0.20736041`; `updatedAt`
  4 seconds before the read, so the push path is live and fresh at review time.
- This is an XTZ/USD feed. A Morpho WXTZ/USDC market needs a WXTZ-in-USDC
  price scaled to 1e36, which requires combining it with a USDC/USD input and
  an explicit assumption that WXTZ tracks XTZ 1:1. Both are Phase 3 items.
- Single-observation freshness is not a heartbeat. The staleness threshold
  MUST be derived from observed update cadence over time, not from one read.

## Risk Recommendation

**Recommendation: NOT APPROVED as of this review.** Not rejected either — the
token contract itself is sound. Approval is blocked on evidence and on
decisions that belong to the risk owner.

Blocking items:

1. **Liquidity (Finding 3).** Caps must be set from measured executable depth.
   On this data, a supply cap above roughly 25,000–30,000 WXTZ cannot be
   liquidated safely. Either accept a very small first market or defer until
   depth improves.
2. **Shared trust root (Finding 2).** One 2-of-3 Safe controls both assets.
   Requires explicit risk-owner acceptance and signer identification.
3. **OFT peer risk (Finding 1).** Requires a decision on whether LayerZero
   peer-compromise risk is acceptable for collateral, plus monitoring of
   `ProposePeer`/`PeerSet` within the 48-hour timelock window.
4. **Provenance.** An official issuer or Etherlink reference for the address.

Suggested parameters, provisional and subject to the above.

**These are not enforceable controls.** Morpho Blue core has no supply or
borrow cap, and ADR 0003 excludes the vault layer that would provide one, so
nothing prevents a third party supplying or borrowing past any figure here via
direct core calls. Read every "cap" below as an **operational target and
monitoring threshold**. See Finding 0 in the
[market risk memo](wxtz-usdc-market-risk-memo.md) for the decision this forces.

- Suggested LLTV: defer to Phase 2 risk memo. Note that a *higher* LLTV
  lowers the liquidation incentive and therefore worsens the Finding 3
  problem; the usual "conservative = low LLTV" instinct is correct here for a
  second reason beyond price volatility.
- Target collateral exposure: **≤ 25,000 WXTZ** (~$5,170) on current depth.
  This is total `supplyCollateral` exposure, not Morpho's `supply()` of the
  loan asset.
- Target borrow exposure: sized so the largest single liquidation stays inside
  the <1% slippage band.
- Required mitigations: duplicate-market monitoring per ADR 0003; DEX route
  monitoring already required by `docs/monitoring.md`; alerting on
  `ProposePeer`, `PeerSet`, and `OwnershipTransferred`.

## Verification

**Pin reads to the recorded block.** Every `eth_call` below uses the review
block `0x2f33a91` (49,494,673) rather than `latest`. Supply, balance, and
adapter state are mutable, so `latest` reproduces *today's* values and cannot
audit the evidence recorded here. Substitute `"latest"` deliberately if you
want a current-state check, and treat that as a separate exercise.

The Kyber depth figures are an unversioned live quote and **cannot** be pinned
this way. They are not reproducible after the fact; re-measuring will produce
different numbers. Treat the curve as a timestamped observation, and see the
blocking TODO on re-measurement.

```bash
RPC=https://node.mainnet.etherlink.com
W=0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb
BLK=0x2f33a91   # 49,494,673 - the review block

# chain identity
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'

# decimals() = 0x12 (18), symbol(), name(), totalSupply()
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$W\",\"data\":\"0x313ce567\"},\"$BLK\"]}"

# native XTZ backing held by the contract
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getBalance\",\"params\":[\"$W\",\"$BLK\"]}"

# EIP-1967 implementation slot -> expect 0x0 (not a proxy)
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getStorageAt\",\"params\":[\"$W\",\"0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc\",\"$BLK\"]}"

# verified ABI and proxy status
curl -s "https://explorer.etherlink.com/api/v2/smart-contracts/$W" | jq '{name,is_verified,proxy_type,implementations}'

# exactly one _update definition -> no transfer-path override
curl -s "https://explorer.etherlink.com/api/v2/smart-contracts/$W" \
  | jq -r '[.source_code] + [.additional_sources[]?.source_code] | .[]' \
  | grep -cE '^\s*function _update'

# executable route
curl -s -H 'x-client-id: etherlinklend-diligence' \
  "https://aggregator-api.kyberswap.com/etherlink/api/v1/routes?tokenIn=$W&tokenOut=0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9&amountIn=25000000000000000000000" \
  | jq -r '.data.routeSummary.amountOut'
```

Safe threshold and owners were read with `getThreshold()` and `getOwners()`
against `0x90481dadc7163d984c4939691c113617fa27c383`.

## Blocking TODOs

- Owner: TODO risk owner. Action: decide Findings 1, 2, and 3, and set caps
  from measured depth. Date: TODO before Shadownet market creation.
- Owner: TODO risk owner. Action: cite an official provenance source for the
  WXTZ address. Date: TODO before market approval.
- Owner: TODO monitoring owner. Action: alert on `ProposePeer`, `PeerSet`, and
  `OwnershipTransferred` for WXTZ. Date: TODO before mainnet market visibility.
- Owner: TODO protocol engineer. Action: re-measure the depth curve against a
  second router and direct pool reserves. Date: TODO before market approval.
