# Pyth Etherlink Feed Verification (PR 3B)

Status: **verification complete. Conclusion: Pyth cannot support production
WXTZ/USDC valuation as currently operated on Etherlink.**

Answers the PR 3B question in #25: *"Verify Pyth XTZ/USD and USDC/USD feed IDs,
freshness semantics, and update requirements; document whether they can support
production WXTZ/USDC valuation."*

This matters more than a routine feed check because
[the RedStone feed-support check](redstone-etherlink-feed-support.md)
established that RedStone on Etherlink **cannot** serve USDC/USD. Pyth was the
only identified source for that leg.

## Contract

| Item | Value |
|---|---|
| Pyth contract (mainnet) | `0x2880aB155794e7179c9eE2e38200202908C17B43` |
| **Proxy** | **Yes** — EIP-1967 implementation slot is populated |
| Implementation | `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` |
| Admin slot (EIP-1967) | empty — admin is not in the standard slot |
| `getValidTimePeriod()` | **60 seconds** |

Two things follow. First, the contract is **upgradeable**, so the oracle
implementation this market would depend on can be replaced. The upgrade
authority was not identified: the EIP-1967 admin slot is empty, so control
sits elsewhere and must be established before any production dependency.

Second, the address is **not** the usual cross-chain Pyth receiver.
`0x4305FB66699C3B2702D4d05CF36551390A4c69C6` has **no code** on Etherlink. Any
script or deployment that hardcodes the common address will silently target an
empty address.

## Feed IDs Verified

Both feed IDs from
[etherlink-price-sources.json](etherlink-price-sources.json) resolve on-chain
and return well-formed price structs:

| Feed | ID | Resolves |
|---|---|---|
| XTZ/USD | `0x0affd4b8ad136a21d79bc82450a325ee12ff55a235abc242666e423b8bcffd03` | yes |
| USDC/USD | `0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a` | yes |

Sample reads:

| Feed | Price | Exponent | Confidence |
|---|---|---|---|
| XTZ/USD | 0.20774273 | `-8` | ±0.00032230 (**~15.5 bps** of price) |
| USDC/USD | 0.99986350 | `-8` | not sampled at the same instant |

The confidence interval is a first-class part of a Pyth price and is currently
ignored by this repository's design notes. At ~15.5 bps on XTZ it is small, but
it widens under stress — exactly when a lending oracle matters. Phase 3C MUST
decide whether to consume, bound, or explicitly ignore `conf`, and record the
reasoning.

Exponent is `-8` for both feeds today. Pyth exponents are per-feed and can
change; an adapter MUST read `expo` at call time rather than hardcoding `1e8`.

## Finding: Freshness Is Not Maintained

This is the decisive result and it changes the Phase 3 direction.

Two observations of the same feeds, roughly 40 minutes apart, with the RPC
confirmed responsive at both:

| Observation | XTZ/USD age | `getPrice()` strict | `getPriceNoOlderThan(30s)` |
|---|---:|---|---|
| First read | **38 s** | would pass | would fail |
| Later read | **162 s** | **REVERTS** | **REVERTS** |

At the later read, `getPrice(bytes32)` and `getPriceNoOlderThan(bytes32,uint)`
at both 30s and 5s **reverted for both XTZ/USD and USDC/USD**. Only
`getPriceUnsafe` returned data, and that data was 162 seconds old against a
60-second validity period.

These were genuine JSON-RPC `execution reverted` responses, not timeouts or
connectivity failures — `eth_blockNumber` succeeded immediately before and
after.

This is normal Pyth behaviour. Pyth is a **pull** oracle: prices live on-chain
only when somebody pays to push a signed update. The 38-second reading was not
a steady state; it was a recent push by an unrelated party. There is no
guarantee of any update cadence.

Contrast with RedStone on the same chain, which is a **push** feed and was
observed updating every 10–21 seconds (mean 16.4s) with a 4-second-old value.

### Why this is disqualifying for a Morpho oracle as-is

Morpho's `liquidate()` calls `IOracle(marketParams.oracle).price()`. So does
the health check used by `borrow` and `withdrawCollateral`. An oracle built on
Pyth has two options and both fail:

1. **Use `getPriceUnsafe`.** The oracle silently returns a stale price.
   Positions are valued at an out-of-date price, liquidations trigger at the
   wrong threshold, and the protocol has no signal that anything is wrong.
   Unacceptable for a lending market.
2. **Use `getPrice` / `getPriceNoOlderThan`.** The oracle **reverts** whenever
   the price is older than the window. A reverting oracle makes
   `liquidate()` revert. **Liquidations become impossible precisely during the
   period the price is not being updated** — which correlates with volatility,
   network stress, and pusher failure. This converts a data-freshness problem
   into an unrecoverable bad-debt problem.

Recall from [ADR 0003](../../docs/adr/0003-first-launch-component-scope.md)
that Morpho has no pause, and from the
[market risk memo](../risk/wxtz-usdc-market-risk-memo.md) that caps are not
enforceable. There is no lever to contain either failure mode after the fact.

## What Would Make Pyth Viable

Not a rejection of Pyth — a statement of what production use requires:

1. **Operate our own pusher.** Fund and run a relayer that calls
   `updatePriceFeeds` on a heartbeat and on deviation, with the same
   reliability requirements the RedStone relayer section of
   [redstone-rpc-feed-plan.md](redstone-rpc-feed-plan.md) already specifies:
   funded keys, failover, alerting, multiple instances. This turns Pyth into a
   push feed at our cost and under our operational control.
2. **Or update in-transaction.** Bundle `updatePriceFeeds` into liquidation and
   borrow transactions. This does not work for Morpho core, whose `price()` is
   a plain `view` call, so it would require periphery not in the ADR 0003
   scope.
3. **Or find another USDC/USD source** on Etherlink.
4. **Or accept a documented USDC = 1.00 assumption** with depeg monitoring and
   a borrow-pause policy. The repository has so far explicitly refused this,
   and `etherlink-price-sources.json` states no hardcoded USDC = 1 source is
   configured. Reopening it is a risk-owner decision, not a default.

Option 1 is the only one that fits the frozen scope without new contracts.
Its cost, ownership, and funding are unresolved.

## Update Requirements

Recorded for whoever implements option 1:

- Updates are submitted via `updatePriceFeeds(bytes[])`, payable. The required
  fee is quoted by `getUpdateFee(bytes[])`. Signed update payloads come from
  a Hermes endpoint; the repository already references
  `https://hermes.pyth.network/v2/updates/price/latest` for monitoring.
- `getValidTimePeriod()` is **60s** on this deployment, so a heartbeat
  meaningfully faster than 60s is required for `getPrice()` to be reliably
  callable.
- The fee must be funded continuously; an unfunded pusher is an outage.
- `getEmaPriceUnsafe` was not successfully sampled and remains unverified.

## Comparison Summary

| Property | RedStone (Etherlink) | Pyth (Etherlink) |
|---|---|---|
| Model | push | pull |
| XTZ/USD | **yes** | yes |
| **USDC/USD** | **no — reverts** | **yes** |
| Observed freshness | 4s, updating every ~16s | 38s once, then **162s stale** |
| Strict accessor at later read | n/a (always readable) | **reverts** |
| Decimals / exponent | 8 | `-8`, per-feed, may change |
| Confidence interval | not exposed | exposed, ~15.5 bps on XTZ |
| Upgradeable | adapter `owner()` reverts, unknown | **yes, proxy**; admin unknown |
| Signer threshold | 2 | not applicable |

Neither provider alone can price WXTZ/USDC on Etherlink today: RedStone lacks
the USDC leg, and Pyth lacks maintained freshness.

## Recommendation For Phase 3C

The oracle design cannot be settled by choosing a provider, because no
provider is currently sufficient. The realistic paths:

- **A. RedStone XTZ/USD + operated Pyth pusher for USDC/USD.** Best data
  quality, adds a funded operational dependency we own.
- **B. RedStone XTZ/USD + documented USDC = 1.00 with depeg monitoring and a
  borrow-pause policy.** Cheapest, reverses a standing repository position, and
  is least defensible if bridged USDC depegs — which the
  [USDC due diligence](../risk/usdc-due-diligence.md) shows is a live risk
  given the bridge's uncapped mint authority.
- **C. Delay the market** until a maintained USDC/USD source exists on
  Etherlink.

Engineering recommends A or C over B, and notes that A's pusher can be
rehearsed on Shadownet only after Pyth parity there is resolved — the Shadownet
Pyth contract differs in size from mainnet.

## Verification

```bash
RPC=https://node.mainnet.etherlink.com
PYTH=0x2880aB155794e7179c9eE2e38200202908C17B43
XTZ=0affd4b8ad136a21d79bc82450a325ee12ff55a235abc242666e423b8bcffd03

# proxy implementation slot -> 0x...a2aa501b19aff244d90cc15a4cf739d2725b5729
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getStorageAt\",\"params\":[\"$PYTH\",\"0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc\",\"latest\"]}"

# getValidTimePeriod() = 0xe18910a3 -> 0x...3c = 60
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$PYTH\",\"data\":\"0xe18910a3\"},\"latest\"]}"

# getPriceUnsafe(bytes32) = 0x96834ad3 -> price, conf, expo, publishTime
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$PYTH\",\"data\":\"0x96834ad3$XTZ\"},\"latest\"]}"

# getPrice(bytes32) = 0x31d98b3f -> reverts when older than validTimePeriod
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$PYTH\",\"data\":\"0x31d98b3f$XTZ\"},\"latest\"]}"
# -> {"error":{"code":-32003,"message":"execution reverted"}} when stale

# compare publishTime against wall clock to get the age
date +%s
```

Decode `getPriceUnsafe` as four 32-byte words: `int64 price`, `uint64 conf`,
`int32 expo`, `uint publishTime`. The observed payload decoded to
price `20774273`, conf `32230`, expo `-8`, publishTime `1785183834`, against a
wall clock of `1785183996` — an age of **162 s**.

Selectors used, computed with keccak-256 over the canonical signature and
self-tested against published values before use:

| Signature | Selector |
|---|---|
| `getValidTimePeriod()` | `0xe18910a3` |
| `getPrice(bytes32)` | `0x31d98b3f` |
| `getPriceUnsafe(bytes32)` | `0x96834ad3` |
| `getPriceNoOlderThan(bytes32,uint256)` | `0xa4ae35e0` |
| `getEmaPriceUnsafe(bytes32)` | `0x9474f45b` |
| `getUpdateFee(bytes[])` | `0xd47eed45` |
| `updatePriceFeeds(bytes[])` | `0xef9e5e28` |

A wrong selector also reverts, so the staleness finding above was confirmed
against the verified `getPrice` selector `0x31d98b3f` rather than inferred from
a revert alone.

## Blocking TODOs

- Owner: TODO oracle reviewer. Action: choose path A, B, or C for the USDC leg
  and record the decision. Date: TODO Phase 3C, before oracle approval.
- Owner: TODO oracle reviewer. Action: identify the upgrade authority for the
  Pyth proxy; the EIP-1967 admin slot is empty. Date: TODO before any
  production dependency on Pyth.
- Owner: TODO oracle reviewer. Action: decide whether the adapter consumes,
  bounds, or ignores the Pyth confidence interval, and record why. Date: TODO
  Phase 3C.
- Owner: TODO operations lead. Action: if path A, cost and staff the Pyth
  pusher including funding, failover, and alerting. Date: TODO before market
  approval.
- Owner: TODO protocol engineer. Action: verify `getEmaPriceUnsafe` and the
  `getUpdateFee` path, neither confirmed here. Date: TODO Phase 3C.
