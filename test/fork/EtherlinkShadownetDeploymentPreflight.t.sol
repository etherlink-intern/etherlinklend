// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {PreflightShadownet} from "../../script/shadownet/00_Preflight.s.sol";
import {DeployShadownetMocks} from "../../script/shadownet/01_DeployMocks.s.sol";
import {DeployShadownetMorphoBlue} from "../../script/shadownet/02_DeployMorphoBlue.s.sol";
import {DeployShadownetIRMAndOracle} from "../../script/shadownet/03_DeployIRMAndOracle.s.sol";
import {CreateShadownetTestMarket} from "../../script/shadownet/04_CreateTestMarket.s.sol";
import {SmokeTestShadownetMarket} from "../../script/shadownet/05_SmokeTestMarket.s.sol";
import {RecordShadownetDeployment} from "../../script/shadownet/06_RecordDeployment.s.sol";

contract EtherlinkShadownetDeploymentPreflightTest is Test {
    function testShadownetConfigExistsAndIsTestnetOnly() public view {
        string memory json = vm.readFile("config/chains/etherlink-shadownet.json");
        assertEq(vm.parseJsonUint(json, ".chainId"), 127_823);
        assertEq(vm.parseJsonString(json, ".rpcEnv"), "ETHERLINK_SHADOWNET_RPC_URL");
        assertEq(vm.parseJsonBool(json, ".allowMainnet"), false);
        assertEq(vm.parseJsonString(json, ".requiresConfirmationEnv"), "CONFIRM_SHADOWNET_DEPLOYMENT");
    }

    function testScriptsImportAndCompile() public pure {
        assertTrue(type(PreflightShadownet).creationCode.length > 0);
        assertTrue(type(DeployShadownetMocks).creationCode.length > 0);
        assertTrue(type(DeployShadownetMorphoBlue).creationCode.length > 0);
        assertTrue(type(DeployShadownetIRMAndOracle).creationCode.length > 0);
        assertTrue(type(CreateShadownetTestMarket).creationCode.length > 0);
        assertTrue(type(SmokeTestShadownetMarket).creationCode.length > 0);
        assertTrue(type(RecordShadownetDeployment).creationCode.length > 0);
    }

    function testForkChainIdWhenRpcIsSet() public {
        string memory rpc = vm.envOr("ETHERLINK_SHADOWNET_RPC_URL", string(""));
        if (bytes(rpc).length == 0) return;

        vm.createSelectFork(rpc);
        assertEq(block.chainid, 127_823);
    }

    function testMainnetConfigIsNotSelectedForShadownetMarket() public view {
        string memory json = vm.readFile("config/markets/shadownet-test-market.json");
        assertEq(vm.parseJsonUint(json, ".chain.chainId"), 127_823);
        assertEq(vm.parseJsonBool(json, ".risk.testnetOnly"), true);
        assertEq(vm.parseJsonBool(json, ".risk.productionApproved"), false);
    }
}
