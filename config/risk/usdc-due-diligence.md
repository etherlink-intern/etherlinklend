# Asset Due Diligence: USDC (Loan Asset Candidate)

Status: **technical review complete, risk-owner approval outstanding.**

All on-chain values were read directly from Etherlink mainnet (chain ID
`42793`) at approximately block **49,494,673** on **2026-07-27**. Commands are
in the Verification section.

## Headline

**This is not Circle-native USDC.** It is a bridge-minted wrapper named
"USD Coin" whose entire supply is controlled by a single bridge contract. Any
risk model that assumes Circle attestation, Circle reserves, or Circle's
blacklist/pause controls is wrong for this asset.

## Asset Identity

- Name: `USD Coin` (read from `name()`)
- Symbol: `USDC` (read from `symbol()`)
- Address: `0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9`
- Chain: Etherlink Mainnet (`42793`)
- Issuer/bridge: `WrappedTokenBridge` at
  `0x1f8e735f424b7a49a885571a2fa104e8c13c26c7`
- Decimals: **6** (read from `decimals()`) — matches
  `config/oracles/etherlink-price-sources.json`
- Total supply: 11,348,300.583576 USDC
- Contract size: 3,064 bytes — small, consistent with a minimal wrapper rather
  than Circle's FiatToken implementation
- Official address source: **still required.** As with WXTZ, the contract
  self-reports the name; that is not provenance.
- Contract verification: verified on Etherlink Blockscout, compiler
  `v0.8.17+commit.8df45f5f`, verified 2024-07-15.

### How we know it is not Circle-native

Circle's FiatTokenV2 exposes `masterMinter()`, `blacklister()`, `pauser()`,
`currency()`, and sits behind an upgradeable `FiatTokenProxy`. Every one of
those was probed on this contract and **none responded**. Blockscout reports
`proxy_type: null` and `implementations: []`.

The verified source is instead a 46-line `WrappedERC20` extending
OpenZeppelin's ERC20:

```solidity
contract WrappedERC20 is ERC20 {
    address public immutable bridge;
    ...
    modifier onlyBridge() {
        require(msg.sender == bridge, "WrappedERC20: caller is not the bridge");
        _;
    }
    function mint(address _to, uint _amount) external virtual onlyBridge { _mint(_to, _amount); }
    function burn(address _from, uint _amount) external virtual onlyBridge { _burn(_from, _amount); }
}
```

with the deployment being `WrappedERC20(_bridge, "USD Coin", "USDC", 6)`.

## Contract Behavior

| Property | Finding | Evidence |
|---|---|---|
| Standard ERC-20 | **Yes** | Plain OpenZeppelin ERC20; no `_transfer`/`_update` override in the verified source. |
| Upgradeable | **No** | Not a proxy; `bridge` and `_tokenDecimals` are `immutable`. |
| Pausable | **No** | Not in the ABI. Nothing can halt transfers. |
| Blacklistable | **No** | Not in the ABI. No address can be frozen. |
| Rebasing | **No** | Plain balances. |
| Fee-on-transfer | **No** | No fee logic on the ERC-20 transfer path. |
| Callback behavior | **No** | No transfer hooks. |
| Permit support | **No** | No `permit`, `nonces`, or `DOMAIN_SEPARATOR`. Integrations MUST use `approve`. |
| Mint authority | **Bridge only, unlimited** | `mint`/`burn` are `onlyBridge`; no cap. |
| Known incidents | None found | Absence of evidence only. |

The **token** is about as simple and predictable as an ERC-20 gets, which is
genuinely good for a Morpho loan asset: no fee-on-transfer accounting
surprises, no pause that could brick repayment, no blacklist that could strand
a liquidation.

The absence of a pause or blacklist cuts both ways. It removes a censorship
and bricking risk, and it also means there is **no on-chain mitigation** if
the bridge is ever compromised and mints unbacked supply. That pairs with
ADR 0003's finding that Morpho itself has no pause: for this market, in an
incident, essentially nothing on-chain can be stopped.

The full ABI is 14 functions: the ERC-20 standard set plus `bridge()`,
`mint`, `burn`, `increaseAllowance`, `decreaseAllowance`. Events are only
`Transfer` and `Approval`.

## Finding 1 — Supply Is Fully Controlled By One Bridge Contract

`bridge()` = `0x1f8e735f424b7a49a885571a2fa104e8c13c26c7`, and it is
**`immutable`** — it cannot be changed after deployment, not even by an
administrator. That is a meaningful positive: there is no "change the minter"
attack path on the token itself.

The bridge is a verified, non-proxy contract named **`WrappedTokenBridge`**
(12,610 bytes, compiler `v0.8.17`). It is LayerZero-based:
`lzReceive`, `nonblockingLzReceive`, `retryMessage`, `forceResumeReceive`,
`setTrustedRemote`, `trustedRemoteLookup`, `isTrustedRemote`, `lzEndpoint`,
`registerToken`, `totalValueLocked`, `withdrawalFeeBps`, `setWithdrawalFeeBps`.

So the trust chain for every USDC on Etherlink is:

```
USDC.mint  ->  onlyBridge  ->  WrappedTokenBridge.lzReceive
           ->  trusted remote (set by bridge owner)  ->  source-chain custody
```

A compromise anywhere along that chain mints unbacked "USDC" with no cap, no
pause, and no blacklist to contain it.

Bridge parameters read on-chain:

| Parameter | Value | Note |
|---|---|---|
| `lzEndpoint()` | `0x2d61dcdd36f10b22176e0433b86f74567d529aaa` | LayerZero endpoint |
| `withdrawalFeeBps()` | **0** | No bridge withdrawal fee currently |
| `TOTAL_BPS()` | 10000 | Fee denominator |
| `owner()` | `0x90481dadc7163d984c4939691c113617fa27c383` | See Finding 2 |

`setWithdrawalFeeBps` is owner-controlled. The fee applies to **bridging out**,
not to ERC-20 transfers, so it does not make this a fee-on-transfer token and
does not affect Morpho accounting. It does affect the economics of moving
liquidity off Etherlink, which matters to liquidators who intend to repatriate
proceeds. The bound on that fee should be confirmed from the bridge source
before approval — this review did not establish whether `setWithdrawalFeeBps`
is capped below `TOTAL_BPS`.

## Finding 2 — The Bridge Owner Is The Same Safe That Owns WXTZ

`WrappedTokenBridge.owner()` = `0x90481dadc7163d984c4939691c113617fa27c383`.

That is the **identical address** that owns WXTZ: a Gnosis Safe
(`GnosisSafeL2` v1.3.0), **threshold 2, three owners**.

One 2-of-3 multisig is therefore the trust root for **both sides of the
proposed WXTZ/USDC market**:

| Asset | Control held by the Safe |
|---|---|
| WXTZ (collateral) | `setPeer` (48h timelock), `setDelegate`, enforced options, msg inspector, precrime, ownership |
| USDC (loan) | `setTrustedRemote` on the bridge that has unlimited mint authority, `registerToken`, `setWithdrawalFeeBps`, `forceResumeReceive`, ownership |

Two signer compromises would allow both hostile WXTZ peer configuration and —
via `setTrustedRemote` — unbacked USDC minting. Unlike WXTZ's `setPeer`, the
bridge's `setTrustedRemote` shows **no timelock** in the ABI, so the USDC side
appears to have a shorter reaction window than the collateral side. That
asymmetry should be confirmed against the bridge source.

Morpho's isolated-market design does not help here. Isolation limits contagion
*between* markets; it does nothing about a dependency shared by both assets
*within* one market.

## Liquidity

USDC is the loan asset, so the liquidation-critical direction is selling WXTZ
collateral **into** USDC. That curve, the price cross-checks, and the resulting
cap constraint are in
[wxtz-due-diligence.md](wxtz-due-diligence.md#liquidity) and are not repeated
here.

Relevant to USDC specifically:

- Reverse direction (USDC → WXTZ) is flat at ~0.2073 through at least
  10,000 USDC, so acquiring WXTZ is not the constrained side.
- Peg monitoring MUST be live rather than assumed. `etherlink-price-sources.json`
  is already correct to refuse a hardcoded USDC = 1.00 source, and this asset
  makes that stricter: a *bridged* USDC can depeg from Circle USDC on bridge
  risk alone, independent of Circle's reserves. The peg being monitored is
  "bridged-USDC vs USD", not "Circle-USDC vs USD".

- **The current source configuration cannot detect a bridge-only depeg, and
  must be changed.** In `etherlink-price-sources.json` the two USDC/USD sources
  marked `"required": true` are Pyth (`pyth-usdc-usd-hermes`) and Binance
  (`binance-usdc-usdt`). **Both price Circle USDC**, which would sit at ~$1.00
  throughout a failure of *this* bridge. The only two sources keyed to this
  contract address — `coingecko-usdc-usd` and `blockscout-usdc-usd` — are
  `"required": false`, and the reference policy takes a **median** across
  sources, so even when they are enabled a lone local depeg signal is
  outvoted by the two Circle-priced sources and masked.

  Required change before approval: at least one source keyed to
  `0x796Ea11F...` must be `"required": true`, and its deviation from the
  Circle-USDC reference must be evaluated **directly** as its own alert
  condition rather than only folded into the median. Refusing a hardcoded
  1.00 is necessary but not sufficient; monitoring the wrong asset is a
  different failure with the same outcome.
- Bridge outflow capacity is part of liquidation economics for any liquidator
  who does not want to hold Etherlink-bridged USDC. Not measured here.

## Oracle

Phase 3 owns oracle selection. Constraints this asset imposes:

- Pyth USDC/USD (`0xeaa020c6...`, already configured) prices **Circle USDC**,
  not this bridged wrapper. Using it means implicitly assuming
  bridged-USDC = Circle-USDC. That assumption is exactly what fails in a
  bridge incident, i.e. precisely when the oracle matters most.
- This does not make the feed unusable — there may be no better option — but
  the assumption MUST be recorded explicitly as a market risk with a
  monitoring and a response policy attached, not left implicit. Note the
  response cannot include pausing anything: as recorded above, neither token
  nor Morpho has a pause, so "policy" here means detection, frontend
  delisting, and communication.
- Confirmed at review time: Pyth XTZ/USD returned `0.20726316` and the
  on-chain RedStone XTZ/USD feed returned `0.20736041`, 4 seconds fresh,
  8 decimals. Both agree with the executable DEX price within 0.2%.

## Risk Recommendation

**Recommendation: NOT APPROVED as of this review.** The token contract is
clean; approval is blocked on bridge-level risk and on decisions belonging to
the risk owner.

Blocking items:

1. **Bridge trust (Finding 1).** Unlimited, uncapped mint authority behind a
   LayerZero trusted-remote configuration, with no pause and no blacklist on
   the token. Requires explicit acceptance.
2. **Shared trust root (Finding 2).** Same 2-of-3 Safe as WXTZ; the bridge
   side appears to lack the 48-hour timelock the WXTZ side has.
3. **Not Circle-native.** Any documentation, frontend copy, or risk material
   describing this as "USDC" without qualification is misleading to users and
   should say "bridged USDC" with the bridge named.
4. **Provenance.** An official reference for both the token and the bridge.
5. **Withdrawal-fee bound.** Confirm whether `setWithdrawalFeeBps` is capped.

Suggested parameters, provisional:

- Suggested supply/borrow caps: bounded by WXTZ liquidation depth, not by
  USDC. See the WXTZ file, Finding 3.
- Required mitigations: live bridged-USDC peg monitoring (see below); alerting
  on bridge `OwnershipTransferred` and `SetTrustedRemote`; duplicate-market
  monitoring per ADR 0003.
- **Mint alerting must watch `Transfer` from the zero address, not a `mint`
  event.** This token's ABI emits only `Transfer` and `Approval` — there is no
  `Mint` event, because `_mint` emits `Transfer(address(0), to, amount)`. A
  monitor configured for a `mint` event would never fire, leaving the
  unlimited-mint scenario this mitigation exists to catch completely
  invisible. Alert on `Transfer` where `from == address(0)`, with an amount or
  cumulative-volume threshold.

## Verification

```bash
RPC=https://node.mainnet.etherlink.com
U=0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9

# decimals() -> 0x06, symbol(), name(), totalSupply()
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$U\",\"data\":\"0x313ce567\"},\"latest\"]}"

# Circle-specific selectors -> all return 0x (absent), proving not FiatToken:
#   masterMinter() 0x35d99f35   blacklister() 0x1a8952b9
#   pauser()       0x9fd0506d   currency()    0xe5a6b10f
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$U\",\"data\":\"0x35d99f35\"},\"latest\"]}"

# bridge() -> 0x1f8e735f...
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$U\",\"data\":\"0xe78cea92\"},\"latest\"]}"

# verified source: WrappedERC20 base with onlyBridge mint/burn
curl -s "https://explorer.etherlink.com/api/v2/smart-contracts/$U" \
  | jq -r '.additional_sources[] | select(.file_path|test("WrappedERC20")) | .source_code'

# bridge identity and owner
curl -s "https://explorer.etherlink.com/api/v2/smart-contracts/0x1f8e735f424b7a49a885571a2fa104e8c13c26c7" \
  | jq '{name,is_verified,proxy_type}'
```

## Blocking TODOs

- Owner: TODO risk owner. Action: decide Findings 1 and 2 and record explicit
  acceptance or rejection of bridge mint risk. Date: TODO before Shadownet
  market creation.
- Owner: TODO risk owner. Action: cite official provenance for the token and
  the bridge. Date: TODO before market approval.
- Owner: TODO protocol engineer. Action: read `WrappedTokenBridge` source to
  confirm whether `setTrustedRemote` is timelocked and whether
  `setWithdrawalFeeBps` is capped. Date: TODO before market approval.
- Owner: TODO communications owner. Action: ensure public materials say
  "bridged USDC", never bare "USDC". Date: TODO before mainnet market
  visibility.
