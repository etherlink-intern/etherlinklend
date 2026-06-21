# Etherlink Shadownet Verification

## Foundry Verification

Etherlink Shadownet uses a Blockscout-style explorer. Verify with Foundry:

```bash
forge verify-contract <ADDRESS> <CONTRACT> \
  --chain 127823 \
  --verifier blockscout \
  --verifier-url "$ETHERLINK_SHADOWNET_EXPLORER_API_URL" \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --constructor-args <ABI_ENCODED_CONSTRUCTOR_ARGS>
```

For deployment-time verification, the Makefile deploy targets use:

```bash
--verify \
--verifier blockscout \
--verifier-url "$ETHERLINK_SHADOWNET_EXPLORER_API_URL" \
--etherscan-api-key "$ETHERSCAN_API_KEY" \
--legacy
```

`ETHERSCAN_API_KEY=YOU_CAN_COPY_ME` is retained for tooling compatibility. Do not store real API tokens.

## Constructor Args

Record constructor args for every deployed contract:

- `Morpho(address newOwner)`.
- `TestOnlyMockERC20(string tokenName, string tokenSymbol, uint8 tokenDecimals, address tokenOwner)`.
- `FixedRateIrm()` has no constructor args.
- `TestOnlyFixedPriceOracle(uint256 initialPrice, address oracleOwner)`.

Store encoded constructor args in the deployment artifact.

## Hardhat Verification

Hardhat is not configured in this repository. If added later, the Hardhat verification command MUST target chain ID `127823` and the Shadownet explorer API only.

## Recording Verification Status

Do not mark verification successful until the explorer confirms it. Record:

- Contract address.
- Explorer URL.
- Verification command.
- Constructor args.
- Compiler version.
- Optimizer settings.
- Result.
- Failure output if any.

## Troubleshooting

- Wrong chain ID: stop; do not retry on mainnet.
- Constructor mismatch: compare artifact args to deployment transaction input.
- Compiler mismatch: check `foundry.toml`, upstream pragma versions, optimizer runs, via-IR, and bytecode hash.
- Blockscout queue delay: wait and re-check explorer status before marking failed.
- API incompatibility: try manual explorer verification and record the reason automated verification failed.

## Legacy Transactions

Official Etherlink development toolkit docs show Foundry deployment with `--legacy`. Keep `--legacy` in Shadownet deployment commands until tested otherwise.

## Manual Verification

If automated verification fails:

1. Open `https://shadownet.explorer.etherlink.com`.
2. Navigate to the contract address.
3. Use the explorer's contract verification UI.
4. Provide source, compiler version, optimizer settings, and constructor args.
5. Record the manual verification result in `deployments/etherlink-shadownet/latest.json`.
