# ADR 0002: Etherlink First Deployment

## Status

Proposed.

## Decision

Target Etherlink for the first planned deployment path.

Expected network values:

- Etherlink Mainnet chain ID: `42793`.
- Etherlink Shadownet chain ID: `127823`.

These values MUST be verified against official Etherlink documentation before deployment.

## Consequences

- EVM compatibility allows Foundry-based deployment and testing.
- Chain-specific verification and deployment behavior MUST be tested.
- Low-fee dust, rounding, and repeated-operation tests are especially important.
- Production operations MUST use dedicated RPC, monitoring, and liquidation infrastructure.

## Verification TODO

- Owner: TODO deployment owner.
- Action: cite official Etherlink network, RPC, explorer, and verification documentation.
- Date: TODO before Shadownet deployment.
