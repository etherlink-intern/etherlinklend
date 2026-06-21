# Etherlink Notes

- Mainnet: chain ID `42793`, RPC env `ETHERLINK_MAINNET_RPC_URL` (default `https://rpc.bubbletez.com`), explorer `https://explorer.etherlink.com`, API `https://explorer.etherlink.com/api`.
- Shadownet: chain ID `127823`, RPC env `ETHERLINK_SHADOWNET_RPC_URL`, explorer `https://shadownet.explorer.etherlink.com`, API `https://shadownet.explorer.etherlink.com/api`.
- Explorers are **Blockscout** (not Etherscan): verify with `--verifier blockscout --verifier-url <explorer>/api/`; no Etherscan API key is needed. See `docs/verification-runbook.md`.
- Verification assumptions must be tested on Shadownet.
- Test deployment with `--legacy` if Etherlink tooling requires legacy transactions.
- Oracle availability must be verified before market creation.
- Public RPC rate limits must not be relied on for production bots, keepers, or liquidators.
