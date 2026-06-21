// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IMorpho} from "morpho-blue/src/interfaces/IMorpho.sol";
import {IIrm} from "morpho-blue/src/interfaces/IIrm.sol";
import {IOracle} from "morpho-blue/src/interfaces/IOracle.sol";

contract PlaceholderTest is Test {
    function testUpstreamInterfacesAreImportable() public pure {
        assertTrue(type(IMorpho).interfaceId != bytes4(0));
        assertTrue(type(IIrm).interfaceId != bytes4(0));
        assertTrue(type(IOracle).interfaceId != bytes4(0));
    }

    function testChainConfigJsonCanBeRead() public view {
        string memory json = vm.readFile("config/chains/etherlink-mainnet.json");
        assertEq(vm.parseJsonUint(json, ".chainId"), 42_793);
        assertEq(vm.parseJsonString(json, ".rpcEnv"), "ETHERLINK_MAINNET_RPC_URL");
    }
}
