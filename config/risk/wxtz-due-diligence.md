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
3. **Cross-chain transfers truncate to 6 decimals.** With
   `decimalConversionRate = 1e12`, any amount not a multiple of 1e12 wei loses
   its remainder on a cross-chain send. This does **not** affect local Morpho
   supply/borrow/repay/withdraw, which use full 18-decimal transfers, but it
   is directly relevant to the repository's dust and rounding focus and MUST
   be covered in the Phase 5 test plan for any flow that crosses chains.

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

| WXTZ in | ≈ USD | USDC out | Effective px | Slippage |
|---:|---:|---:|---:|---:|
| 1,000 | ~207 | 206.94 | 0.206940 | baseline |
| 5,000 | ~1,034 | 1,034.39 | 0.206878 | −0.03% |
| 10,000 | ~2,068 | 2,068.29 | 0.206829 | −0.05% |
| 15,000 | ~3,101 | 3,100.55 | 0.206703 | −0.11% |
| 20,000 | ~4,129 | 4,129.48 | 0.206474 | −0.23% |
| 25,000 | ~5,147 | 5,146.88 | 0.205875 | −0.51% |
| 30,000 | ~6,068 | 6,068.18 | 0.202273 | **−2.25%** |
| 40,000 | ~6,534 | 6,533.80 | 0.163345 | **−21.06%** |
| 50,000 | ~6,310 | 6,310.38 | 0.126208 | **−39.01%** |
| 100,000 | ~5,823 | 5,823.42 | 0.058234 | **−71.86%** |
| 250,000 | ~1,710 | 1,710.23 | 0.006841 | **−96.69%** |

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
With a ~4.4% incentive:

- A liquidation of ≤ 25,000 WXTZ (~$5,150) is comfortably profitable.
- A liquidation of ~30,000 WXTZ (~$6,100) is marginal at 2.25% slippage
  before gas and liquidator margin.
- A liquidation of ≥ 40,000 WXTZ (~$8,300) is **deeply unprofitable**. No
  rational liquidator acts, the position is not cleared, and the market
  accrues bad debt.

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

Suggested parameters, provisional and subject to the above:

- Suggested LLTV: defer to Phase 2 risk memo. Note that a *higher* LLTV
  lowers the liquidation incentive and therefore worsens the Finding 3
  problem; the usual "conservative = low LLTV" instinct is correct here for a
  second reason beyond price volatility.
- Suggested supply cap: **≤ 25,000 WXTZ** (~$5,200) on current depth.
- Suggested borrow cap: sized so the largest single liquidation stays inside
  the <1% slippage band.
- Required mitigations: duplicate-market monitoring per ADR 0003; DEX route
  monitoring already required by `docs/monitoring.md`; alerting on
  `ProposePeer`, `PeerSet`, and `OwnershipTransferred`.

## Verification

```bash
RPC=https://node.mainnet.etherlink.com
W=0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb

# chain identity
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'

# decimals() = 0x12 (18), symbol(), name(), totalSupply()
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$W\",\"data\":\"0x313ce567\"},\"latest\"]}"

# native XTZ backing held by the contract
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getBalance\",\"params\":[\"$W\",\"latest\"]}"

# EIP-1967 implementation slot -> expect 0x0 (not a proxy)
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getStorageAt\",\"params\":[\"$W\",\"0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc\",\"latest\"]}"

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
