# RedStone Etherlink Feed-Support Check (Archived Evidence)

Status: **check reproduced and archived. Oracle design decision still open (Phase 3C).**

This file closes the standing blocker carried from #2 and tracked as PR 3A in
#25: *"reproduce and archive the RedStone Etherlink feed-support check showing
XTZ/ETH/BTC support and USDC rejection, including exact commands and block
context."*

The check was reproduced against live Etherlink infrastructure. Every claim
below is a direct on-chain read, not a documentation citation.

## Block Context

| Item | Value |
|---|---|
| Etherlink Mainnet chain ID | `42793` (`eth_chainId` → `0xa729`) |
| Etherlink Shadownet chain ID | `127823` (`eth_chainId` → `0x1f34f`) |
| Mainnet block at time of check | ~`49,495,719` (`0x2f33ea7`) |
| Date | 2026-07-27 |
| Mainnet RPC | `https://node.mainnet.etherlink.com` |
| Shadownet RPC | `https://node.shadownet.etherlink.com` |

Both chain IDs match the expected values in
[ADR 0002](../../docs/adr/0002-etherlink-first-deployment.md), which had
recorded them as requiring verification. **They are now verified.**

## Result: XTZ, ETH, BTC Supported — USDC Rejected

The Etherlink RedStone price feed is a Chainlink-style wrapper over a shared
adapter. The feed points at its adapter via `getPriceFeedAdapter()`, and the
adapter is where the supported-feed set lives.

| Contract | Address |
|---|---|
| Mainnet XTZ/USD price feed | `0xe92c00BC72dD12e26E61212c04E8D93aa09624F2` |
| Mainnet adapter | `0xa2cca359c43839040cf3d230deb1689ab8db2dac` |
| Shadownet XTZ/USD price feed | `0xb9D0073aCb296719C26a8BF156e4b599174fe1d5` |
| Shadownet adapter | `0x65d0f14f7809cdc4f90c3978c753c4671b6b815b` |

`getDataFeedIds()` on the mainnet adapter returns **exactly three** feeds:

| Feed ID (bytes32) | Symbol |
|---|---|
| `0x58545a00...` | `XTZ` |
| `0x45544800...` | `ETH` |
| `0x42544300...` | `BTC` |

`getValueForDataFeed(bytes32)` was then probed per symbol. Supported symbols
return a value; unsupported symbols **revert**:

| Symbol | Result | Value (8 dp) |
|---|---|---|
| `XTZ` | **supported** | `20808545` → 0.20808545 |
| `ETH` | **supported** | `194534584873` → 1945.34584873 |
| `BTC` | **supported** | `6492905412000` → 64929.05412000 |
| `USDC` | **REVERTS** | — |
| `USDT` | **REVERTS** | — |
| `EUR` | **REVERTS** | — |
| `NOPE` (control) | **REVERTS** | — |

The `NOPE` control confirms the revert is genuine feed rejection behaviour and
not an artifact of the call encoding.

**Conclusion, stated precisely: the RedStone adapter currently deployed on
Etherlink (`0xa2cca359...`) does not expose USDC/USD at the sampled block.**
The claim carried from #2 is confirmed for the deployed path.

This is **not** proof that RedStone's off-chain data service cannot supply
USDC to a different adapter. A custom or self-operated adapter with a
different feed set may be possible; `redstone-rpc-feed-plan.md` treats that
path as blocked pending review rather than impossible, and this check does not
change that. What is ruled out is using the **existing shared feed** for the
USDC leg — which is what the market design was implicitly assuming.

## Feed Parameters

Values the launch checklist requires for the RedStone gate ("data-service ID,
signer threshold, adapter/feed address, and update conditions documented"):

| Parameter | Value | Source |
|---|---|---|
| Feed ID | `XTZ` | `getDataFeedId()` on the price feed |
| Decimals | **8** | `decimals()` |
| `description()` | `"Redstone Price Feed"` | on-chain |
| Adapter address | `0xa2cca359...` | `getPriceFeedAdapter()` |
| **Unique signers threshold** | **2** | `getUniqueSignersThreshold()` on the adapter |
| Data-service ID | **not exposed on-chain** — `getDataServiceId()` reverts | must be obtained from RedStone off-chain |
| Adapter `owner()` | **reverts** — no Ownable owner exposed | upgrade/admin path not established by this check |

Two of those remain open and are recorded as blocking TODOs below: the
data-service ID and the adapter's admin/upgrade authority.

**On the threshold of 2 — do not read it as "2 independent parties".**
`getUniqueSignersThreshold()` establishes only that two *distinct authorised
signer addresses* are required. It says nothing about who holds those keys or
whether they are operated independently. Since the signer set and the
data-service ID are both unknown here, the decentralisation this implies is
unestablished: two addresses could belong to one operator. The risk owner
should treat "threshold 2" as the on-chain fact and defer any independence
judgement until the signer operators are identified.

## Measured Update Cadence

The due-diligence review noted that a single fresh read is not a heartbeat.
Twelve consecutive rounds were therefore sampled via `getRoundData(uint80)`:

| Round | Price | `updatedAt` | Gap |
|---:|---:|---:|---:|
| 4447263 | 0.20805165 | 1785182774 | — |
| 4447262 | 0.20805948 | 1785182763 | 11s |
| 4447261 | 0.20812390 | 1785182753 | 10s |
| 4447260 | 0.20808545 | 1785182743 | 10s |
| 4447259 | 0.20808545 | 1785182724 | 19s |
| 4447258 | 0.20808545 | 1785182714 | 10s |
| 4447257 | 0.20808337 | 1785182694 | 20s |
| 4447256 | 0.20808545 | 1785182674 | 20s |
| 4447255 | 0.20808337 | 1785182655 | 19s |
| 4447254 | 0.20808337 | 1785182634 | 21s |
| 4447253 | 0.20806028 | 1785182614 | 20s |
| 4447252 | 0.20798555 | 1785182594 | 20s |

**Observed: min 10s, max 21s, mean 16.4s across 11 gaps.**

Two caveats that matter before this becomes a staleness threshold:

1. This is a **~3-minute window**. A staleness threshold MUST be derived from
   at least 24 hours of observation, ideally spanning a volatility event, not
   from this sample.
2. Identical prices repeat across rounds (`0.20808545` appears four times),
   which indicates heartbeat-driven updates independent of deviation. The
   deviation threshold is therefore **not** inferable from this data and must
   come from RedStone configuration.

The existing `staleAfterSeconds: 90` in
[etherlink-price-sources.json](etherlink-price-sources.json) is consistent
with the observed cadence — roughly 4–9× the observed gap — but it was not
derived from measurement. It should be re-derived once a longer sample exists.

## The USDC Leg: Pyth Is Live On Etherlink And Does Provide USDC/USD

Because RedStone rejects USDC, the USDC/USD leg needs another source. The
repository's monitor config already references Pyth via the off-chain Hermes
endpoint, but an on-chain Morpho oracle needs an **on-chain** Pyth contract.

One exists on Etherlink mainnet:

| Item | Value |
|---|---|
| Pyth contract | `0x2880aB155794e7179c9eE2e38200202908C17B43` |
| `getValidTimePeriod()` | **60 seconds** |
| XTZ/USD (`0x0affd4b8...`) | `0.20779388`, published 38s before the read |
| **USDC/USD (`0xeaa020c6...`)** | **`0.99986350`**, published 38s before the read |

Both feeds returned fresh values at the time of the check. That makes a
Morpho-compatible WXTZ/USDC oracle **arithmetically constructible** — but see
the two asset-identity caveats below before treating it as a solution, and see
[the Pyth verification](pyth-etherlink-feed-verification.md) for why the
freshness observed here did not hold.

```
WXTZ/USDC  ≈  XTZ/USD  ÷  USDC/USD
              ^RedStone or Pyth   ^Pyth only
```

The `≈` is doing real work in that formula, on **both** legs:

- **Numerator.** `XTZ/USD` is not `WXTZ/USD`. It is only equal while WXTZ
  tracks XTZ 1:1, and Finding 1 of the
  [WXTZ due diligence](../risk/wxtz-due-diligence.md) shows that assumption has
  a failure mode: a compromised LayerZero peer can mint WXTZ that is not backed
  by newly locked XTZ, and the backing pool can be drained. In that state this
  formula **overvalues the collateral** — during exactly the incident when
  accurate collateral valuation matters. The oracle design MUST require
  validation and monitoring of the wrapper's backing ratio, not assume 1:1.
- **Denominator.** `USDC/USD` from Pyth prices **Circle USDC**, while the loan
  token is a bridge-minted wrapper. See the caveat below.

**Asset-identity caveat: this does not solve the USDC fallback problem.** Feed
`0xeaa020c6...` prices Circle-issued USDC. The market's loan token is the
Etherlink bridge-minted wrapper, which can depeg from Circle USDC on bridge
risk alone while this feed sits at ~$1.00. Dividing by it therefore still
embeds the assumption "bridged-USDC = Circle-USDC", and would misquote WXTZ in
units of the actual loan asset precisely during a bridge incident. Having a
live feed removes the *hardcoded constant*, not the *basis risk*. Phase 3C must
carry that assumption explicitly with monitoring and a response policy rather
than treating the fallback question as closed.

**Provenance caveat: this contract is not verified as an official Pyth
receiver.** Everything above comes from on-chain probing. A successful
`getPriceUnsafe` call and plausible values establish that the contract exposes
the Pyth interface and returns sensible numbers — not that it is the canonical
Pyth deployment. Any contract can expose that interface. This repository's own
oracle requirements call for feed addresses to be verified from official
documentation, and that has not been done for `0x2880aB15...`. Using an
unverified receiver would place borrow and liquidation pricing under unknown
control. Verify from official Pyth or Etherlink sources before Phase 3C relies
on it.

Two further operational risks follow directly and must be carried into Phase 3C:

1. **The 60-second validity window is tight.** The observed publish age was
   38s against a 60s window. The strict `getPrice()` variant reverts outside
   that window, so an oracle built on it inherits a hard dependency on a
   third-party pusher continuing to update roughly every minute. A pusher
   outage of ~1 minute makes the price unavailable, not merely stale.
2. **Whoever operates that pusher is an unnamed dependency.** This check did
   not establish who funds or runs it, or what their uptime commitment is.

Address probing note: `0x4305FB66...` (the most common Pyth receiver address
across chains) has **no code** on Etherlink. `0xA2aa501b...` has code but
reverts on the Pyth interface, so it is not the receiver. Do not assume the
usual cross-chain address.

## Shadownet Parity

| Item | Mainnet | Shadownet |
|---|---|---|
| RedStone XTZ feed | `0xe92c00BC...` | `0xb9D0073a...` |
| Feed ID / decimals | `XTZ` / 8 | `XTZ` / 8 |
| Adapter | `0xa2cca359...` | `0x65d0f14f...` |
| Live at check | yes, 4s old | yes, **2s old**, `0.20798347` |
| Pyth contract code | 708 bytes | **177 bytes** |

RedStone XTZ parity on Shadownet is good, which supports a realistic
rehearsal of the XTZ leg. **Pyth parity is not established**: the same address
holds a much smaller contract on Shadownet, so it may be a different or stub
deployment. Since the USDC leg depends on Pyth, this must be resolved before a
Shadownet rehearsal can be claimed to exercise the real oracle path.

## Consequences For Oracle Design (Phase 3C Inputs)

1. A RedStone-only oracle for WXTZ/USDC is **not possible** on Etherlink. Any
   design MUST either use Pyth for the USDC leg or justify an alternative.
2. The repository's standing refusal to hardcode USDC = 1.00 remains correct
   and is now backed by a live alternative, so the fallback is not needed.
3. Mixing providers means two failure domains, two staleness policies, and two
   sets of update assumptions. Phase 3C must define behaviour when one leg is
   fresh and the other is stale.
4. Recall from the market risk memo that the oracle must return the WXTZ price
   in USDC scaled to **1e24** (`36 + 6 - 18`), ≈ `2.069e23` at current prices.
   Neither raw feed is in that form; the adapter does the conversion, and that
   conversion is where decimals bugs live.
5. RedStone's 8-decimal output and Pyth's `expo = -8` are convenient but MUST
   NOT be assumed constant. Pyth exponents are per-feed and can change.

## Verification

Reproduce with:

```bash
RPC=https://node.mainnet.etherlink.com
FEED=0xe92c00BC72dD12e26E61212c04E8D93aa09624F2
ADAPTER=0xa2cca359c43839040cf3d230deb1689ab8db2dac
PYTH=0x2880aB155794e7179c9eE2e38200202908C17B43
BLK=0x2f33ea7   # 49,495,719 - the block this check was archived at

# chain id -> 0xa729 (42793)
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'

# feed -> adapter.  getPriceFeedAdapter() = 0x47043b00
# -> 0x...a2cca359c43839040cf3d230deb1689ab8db2dac
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$FEED\",\"data\":\"0x47043b00\"},\"$BLK\"]}"

# supported feed ids.  getDataFeedIds() = 0xfba03158
# -> offset 0x20, length 0x03, then 58545a.. (XTZ), 455448.. (ETH), 425443.. (BTC)
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$ADAPTER\",\"data\":\"0xfba03158\"},\"$BLK\"]}"

# signer threshold.  getUniqueSignersThreshold() = 0xf90c4924  -> 0x..02
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$ADAPTER\",\"data\":\"0xf90c4924\"},\"$BLK\"]}"

# supported symbol.  getValueForDataFeed(bytes32) = 0x44e02982
# arg = bytes32("XTZ") right-padded -> returns a value
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$ADAPTER\",\"data\":\"0x44e0298258545a0000000000000000000000000000000000000000000000000000000000\"},\"$BLK\"]}"

# USDC rejection: same selector, bytes32("USDC")
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$ADAPTER\",\"data\":\"0x44e029825553444300000000000000000000000000000000000000000000000000000000\"},\"$BLK\"]}"
# -> {"error":{"code":-32003,"message":"execution reverted"}}

# Pyth USDC/USD on-chain.  getPriceUnsafe(bytes32) = 0x96834ad3
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$PYTH\",\"data\":\"0x96834ad3eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a\"},\"$BLK\"]}"
```

Selectors were computed with keccak-256 over the canonical signature and
self-tested against published values (`transfer(address,uint256)` →
`0xa9059cbb`, `decimals()` → `0x313ce567`) before use. Every command block
above was executed as written and its output checked against the tables in
this document.

Selector reference for the calls used here:

| Signature | Selector |
|---|---|
| `getPriceFeedAdapter()` | `0x47043b00` |
| `getDataFeedIds()` | `0xfba03158` |
| `getValueForDataFeed(bytes32)` | `0x44e02982` |
| `getUniqueSignersThreshold()` | `0xf90c4924` |
| `getDataFeedId()` | `0xc8337760` |
| `getRoundData(uint80)` | `0x9a6fc8f5` |
| `getPriceUnsafe(bytes32)` | `0x96834ad3` |

## Blocking TODOs

- Owner: TODO oracle reviewer. Action: obtain the RedStone **data-service ID**
  and signer set from RedStone; `getDataServiceId()` is not exposed on-chain.
  Date: TODO before oracle approval.
- Owner: TODO oracle reviewer. Action: establish the adapter's admin/upgrade
  authority; `owner()` reverts, so the control path is unknown. Date: TODO
  before oracle approval.
- Owner: TODO monitoring owner. Action: sample feed cadence for **at least 24
  hours** and re-derive the staleness threshold; the 90s value in
  `etherlink-price-sources.json` is plausible but not measured. Date: TODO
  before market approval.
- Owner: TODO oracle reviewer. Action: identify who operates and funds the
  Etherlink Pyth pusher and what uptime is committed, given the 60s validity
  window. Date: TODO before oracle approval.
- Owner: TODO protocol engineer. Action: confirm whether the Shadownet Pyth
  deployment is functionally equivalent to mainnet; the code sizes differ.
  Date: TODO before Shadownet rehearsal.
- Owner: TODO oracle reviewer. Action: define behaviour when one leg is fresh
  and the other is stale. Date: TODO Phase 3C.
