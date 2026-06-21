# Verification Runbook

Record compiler version, optimizer settings, via-IR setting, bytecode hash setting, constructor arguments, source commit SHAs, explorer links, and any Etherlink-specific verification flags. Reproduce bytecode locally before approving a deployment record.

## Explorer / Verifier

Etherlink explorers are **Blockscout**, not Etherscan, so verify with the Blockscout verifier. No Etherscan API key is required.

```bash
# Mainnet (explorer https://explorer.etherlink.com)
forge verify-contract <ADDRESS> <CONTRACT> \
  --verifier blockscout \
  --verifier-url https://explorer.etherlink.com/api/

# Shadownet
forge verify-contract <ADDRESS> <CONTRACT> \
  --verifier blockscout \
  --verifier-url https://shadownet.explorer.etherlink.com/api/
```

Notes:
- The `--verifier-url` must point at the Blockscout `/api/` endpoint (trailing slash).
- `bytecode_hash = "none"` (see `foundry.toml`) keeps the metadata hash out of bytecode; pass the same compiler settings used at deploy time.
- Test the full verify flow on Shadownet before mainnet, and confirm whether Etherlink tooling requires `--legacy` transactions.
