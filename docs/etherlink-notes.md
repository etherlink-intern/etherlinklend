# Etherlink Notes

## Networks

Expected Etherlink network values:

| Network | Chain ID | Native token | RPC env var | Explorer | Explorer API | Status |
|---|---:|---|---|---|---|---|
| Etherlink Mainnet | `42793` | `XTZ` | `ETHERLINK_MAINNET_RPC_URL` | `https://explorer.etherlink.com` | `https://explorer.etherlink.com/api/` | Not approved for production until launch checklist completion |
| Etherlink Shadownet | `127823` | `XTZ` | `ETHERLINK_SHADOWNET_RPC_URL` | `https://shadownet.explorer.etherlink.com` | `https://shadownet.explorer.etherlink.com/api/` | Testnet only |

These values MUST be verified against official Etherlink documentation before deployment.

TODO:

- Owner: TODO deployment owner.
- Action: cite official Etherlink network and explorer documentation.
- Date: TODO before Shadownet deployment.

## Deployment Considerations

- Foundry deployment scripts MUST support dry run first.
- Broadcast mode MUST NOT run unless `CONFIRM_DEPLOYMENT=true` or an equivalent explicit gate is set.
- The deployment owner SHOULD test whether `--legacy` is required for Etherlink deployment and verification tooling.
- Deployment artifacts MUST be stored after every broadcast.
- Deployment scripts in this repo are placeholders and do not deploy production Morpho Blue contracts.

## Explorer Verification

Etherlink explorers are expected to be Blockscout-style explorers. Verify contracts with the Blockscout verifier where supported:

```bash
forge verify-contract <ADDRESS> <CONTRACT> \
  --verifier blockscout \
  --verifier-url https://explorer.etherlink.com/api/
```

No Etherscan API key should be required for Blockscout verification, but the exact verification flow MUST be tested on Shadownet before mainnet.

## Oracle Availability

Planned oracle sources include Pyth and/or RedStone, subject to official feed support.

Markets MUST NOT be created until:

- The feed exists for the intended loan asset/collateral asset pair.
- Feed IDs or adapter addresses are verified against official sources.
- Feed decimals are verified.
- Staleness thresholds are defined.
- Decimals normalization is tested.
- Fail-closed behavior is tested.

## Operational Infrastructure

Production deployment MUST have:

- Dedicated RPC.
- Monitoring.
- Liquidation bot or liquidator operator readiness.
- Alerts for oracle staleness.
- Alerts for bad debt or near-bad-debt conditions.
- Alerts for abnormal utilization.
- Alerts for failed liquidations.
- Alerts for indexer/RPC failure.

Public RPCs MAY be used for development, but they are not sufficient for production bots, monitoring, or liquidation infrastructure.

## Low-Fee Implications

Etherlink low transaction costs make repeated dust transactions more practical. Fuzz and invariant tests SHOULD include high-iteration tiny deposits, borrows, repays, withdrawals, and liquidations.

Gas-cost-based attack deterrence MUST NOT be assumed.
