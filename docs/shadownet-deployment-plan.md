# Etherlink Shadownet Deployment Plan

## Objective

Deploy a test-only Morpho Blue-based isolated lending setup to Etherlink Shadownet Testnet.

## Scope

- Testnet only.
- No user funds.
- No production parameters.
- No mainnet broadcast.
- No production admin address.
- No production asset listing.

Network values were checked against official Etherlink documentation on 2026-06-21:

- Network information: `https://docs.etherlink.com/get-started/network-information/`
- Development toolkits: `https://docs.etherlink.com/building-on-etherlink/development-toolkits/`

Re-verify those sources before deployment.

## Components To Deploy

The deployment package is prepared for a project-owned Shadownet deployment because this repo does not assume an official Morpho Blue deployment exists on Etherlink.

Components:

- Morpho Blue core: `Morpho(address newOwner)` from `lib/morpho-blue/src/Morpho.sol`.
- IRM: upstream-compatible `FixedRateIrm` from `lib/morpho-blue-irm/src/fixed-rate-irm/FixedRateIrm.sol`.
- Loan token: `TestOnlyMockERC20` mock asset for Shadownet only.
- Collateral token: `TestOnlyMockERC20` mock asset for Shadownet only.
- Oracle: `TestOnlyFixedPriceOracle` fixed-price oracle for Shadownet only.

Do not modify upstream Morpho Blue logic. Do not use these mock assets or oracle in production.

## Market To Create

First Shadownet market:

- Loan asset: `MOCK_LOAN` test-only ERC20.
- Collateral asset: `MOCK_COLLATERAL` test-only ERC20.
- Oracle: `TEST_ONLY_FIXED_PRICE_ORACLE`, unless a verified Shadownet Pyth or RedStone adapter is intentionally selected later.
- IRM: `FixedRateIrm`.
- LLTV: conservative test value, default `0.5e18`.
- Caps: not enforced by Morpho Blue core in this package; config records low test caps only.
- Status: test-only.

## Why Use Mocks First

- Avoid accidental reliance on unreviewed bridged assets.
- Test deployment mechanics separately from production asset/oracle risk.
- Validate Morpho Blue imports, constructor args, market creation, verification, smoke tests, and artifact recording.

## Explicit Non-Goals

- No production asset listing.
- No production oracle listing.
- No public launch.
- No frontend launch.
- No mainnet deployment.
- No claim that Shadownet success implies mainnet safety.

## Safety Gates

Broadcast is allowed only when:

- `CONFIRM_SHADOWNET_DEPLOYMENT=true`.
- `SHADOWNET_BROADCAST=true` is set by the Make target.
- `PRIVATE_KEY` exists only in local uncommitted environment.
- RPC chain ID is `127823`.
- Build and tests pass.
- Preflight has no critical blockers.
- No placeholder addresses remain in selected deployment env/config.
