.PHONY: install build test test-v fmt fmt-check snapshot slither clean fork-shadownet fork-mainnet dry-run-shadownet dry-run-mainnet preflight-shadownet test-fork-shadownet deploy-mocks-shadownet deploy-core-shadownet deploy-irm-oracle-shadownet create-market-shadownet smoke-test-shadownet verify-shadownet record-shadownet deploy-all-shadownet clean-shadownet-artifacts

install:
	pnpm install --frozen-lockfile
	git submodule update --init --recursive

build:
	forge build

test:
	forge test

test-v:
	forge test -vvv

fmt:
	forge fmt

fmt-check:
	forge fmt --check

snapshot:
	forge snapshot

slither:
	slither . --config-file .slither.json --sarif slither-report.sarif || true

clean:
	forge clean
	rm -rf cache out coverage lcov.info

fork-shadownet:
	forge test --match-path "test/fork/EtherlinkShadownetFork.t.sol" --fork-url "$${ETHERLINK_SHADOWNET_RPC_URL}"

test-fork-shadownet:
	forge test --match-path "test/fork/*Shadownet*" --fork-url "$${ETHERLINK_SHADOWNET_RPC_URL}"

fork-mainnet:
	forge test --match-path "test/fork/EtherlinkMainnetFork.t.sol" --fork-url "$${ETHERLINK_MAINNET_RPC_URL}"

dry-run-shadownet:
	forge script script/shadownet/00_Preflight.s.sol --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}" -vvvv

preflight-shadownet:
	cast chain-id --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}"
	test -n "$${DEPLOYER_ADDRESS}"
	cast balance "$${DEPLOYER_ADDRESS}" --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}"
	forge script script/shadownet/00_Preflight.s.sol --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}" -vvvv

deploy-mocks-shadownet:
	test "$${CONFIRM_SHADOWNET_DEPLOYMENT}" = "true"
	SHADOWNET_BROADCAST=true forge script script/shadownet/01_DeployMocks.s.sol --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}" --private-key "$${PRIVATE_KEY}" --broadcast --verify --verifier blockscout --verifier-url "$${ETHERLINK_SHADOWNET_EXPLORER_API_URL}" --etherscan-api-key "$${ETHERSCAN_API_KEY}" --legacy -vvvv

deploy-core-shadownet:
	test "$${CONFIRM_SHADOWNET_DEPLOYMENT}" = "true"
	SHADOWNET_BROADCAST=true forge script script/shadownet/02_DeployMorphoBlue.s.sol --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}" --private-key "$${PRIVATE_KEY}" --broadcast --verify --verifier blockscout --verifier-url "$${ETHERLINK_SHADOWNET_EXPLORER_API_URL}" --etherscan-api-key "$${ETHERSCAN_API_KEY}" --legacy -vvvv

deploy-irm-oracle-shadownet:
	test "$${CONFIRM_SHADOWNET_DEPLOYMENT}" = "true"
	SHADOWNET_BROADCAST=true forge script script/shadownet/03_DeployIRMAndOracle.s.sol --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}" --private-key "$${PRIVATE_KEY}" --broadcast --verify --verifier blockscout --verifier-url "$${ETHERLINK_SHADOWNET_EXPLORER_API_URL}" --etherscan-api-key "$${ETHERSCAN_API_KEY}" --legacy -vvvv

create-market-shadownet:
	test "$${CONFIRM_SHADOWNET_DEPLOYMENT}" = "true"
	SHADOWNET_BROADCAST=true forge script script/shadownet/04_CreateTestMarket.s.sol --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}" --private-key "$${PRIVATE_KEY}" --broadcast --legacy -vvvv

smoke-test-shadownet:
	test "$${CONFIRM_SHADOWNET_DEPLOYMENT}" = "true"
	SHADOWNET_BROADCAST=true forge script script/shadownet/05_SmokeTestMarket.s.sol --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}" --private-key "$${PRIVATE_KEY}" --broadcast --legacy -vvvv

verify-shadownet:
	@echo "Use docs/shadownet-verification.md and verify each deployed contract with --verifier blockscout --verifier-url $${ETHERLINK_SHADOWNET_EXPLORER_API_URL}"

record-shadownet:
	forge script script/shadownet/06_RecordDeployment.s.sol --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}" -vvvv

deploy-all-shadownet:
	test "$${CONFIRM_SHADOWNET_DEPLOYMENT}" = "true"
	$(MAKE) build
	$(MAKE) test
	$(MAKE) preflight-shadownet
	$(MAKE) deploy-mocks-shadownet
	$(MAKE) deploy-core-shadownet
	$(MAKE) deploy-irm-oracle-shadownet
	$(MAKE) create-market-shadownet
	$(MAKE) smoke-test-shadownet
	$(MAKE) record-shadownet

clean-shadownet-artifacts:
	rm -f deployments/etherlink-shadownet/latest.json deployments/etherlink-shadownet/latest.md
	rm -f deployments/etherlink-shadownet/runs/*-shadownet.json

dry-run-mainnet:
	forge script script/DryRun.s.sol --rpc-url "$${ETHERLINK_MAINNET_RPC_URL}"
