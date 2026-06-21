// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;
import {Test} from "forge-std/Test.sol";

contract EtherlinkMainnetForkTest is Test {
    function testForkSkippedWithoutRpc() public {
        string memory rpc = vm.envOr("ETHERLINK_MAINNET_RPC_URL", string(""));
        if (bytes(rpc).length == 0) return;
        vm.createSelectFork(rpc);
        assertEq(block.chainid, 42793);
    }
}
