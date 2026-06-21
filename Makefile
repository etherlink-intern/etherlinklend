.PHONY: install build test test-v fmt fmt-check snapshot slither clean fork-shadownet fork-mainnet dry-run-shadownet dry-run-mainnet

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

fork-mainnet:
	forge test --match-path "test/fork/EtherlinkMainnetFork.t.sol" --fork-url "$${ETHERLINK_MAINNET_RPC_URL}"

dry-run-shadownet:
	forge script script/DryRun.s.sol --rpc-url "$${ETHERLINK_SHADOWNET_RPC_URL}"

dry-run-mainnet:
	forge script script/DryRun.s.sol --rpc-url "$${ETHERLINK_MAINNET_RPC_URL}"
