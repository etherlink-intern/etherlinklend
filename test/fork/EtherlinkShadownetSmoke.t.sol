// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";

contract EtherlinkShadownetSmokeTest is Test {
    function testLatestArtifactIsDraftOrHasDeployedCode() public {
        string memory rpc = vm.envOr("ETHERLINK_SHADOWNET_RPC_URL", string(""));
        if (bytes(rpc).length == 0) return;

        vm.createSelectFork(rpc);
        assertEq(block.chainid, 127_823);

        string memory json = vm.readFile("deployments/etherlink-shadownet/latest.json");
        string memory status = vm.parseJsonString(json, ".status");
        if (keccak256(bytes(status)) == keccak256(bytes("draft"))) return;

        address loanToken = vm.parseJsonAddress(json, ".market.loanToken");
        address collateralToken = vm.parseJsonAddress(json, ".market.collateralToken");
        address oracle = vm.parseJsonAddress(json, ".market.oracle");
        address irm = vm.parseJsonAddress(json, ".market.irm");

        assertGt(loanToken.code.length, 0, "loan token code missing");
        assertGt(collateralToken.code.length, 0, "collateral token code missing");
        assertGt(oracle.code.length, 0, "oracle code missing");
        assertGt(irm.code.length, 0, "irm code missing");
    }

    function testShadownetSmokeConfigIsMockOnly() public view {
        string memory json = vm.readFile("config/markets/shadownet-test-market.json");
        assertEq(vm.parseJsonString(json, ".market.loanTokenSymbol"), "MOCK_LOAN");
        assertEq(vm.parseJsonString(json, ".market.collateralTokenSymbol"), "MOCK_COLLATERAL");
        assertEq(vm.parseJsonString(json, ".market.oracleType"), "TEST_ONLY_FIXED_PRICE_ORACLE");
    }
}
