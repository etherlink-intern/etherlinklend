// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

import {ShadownetScript} from "./ShadownetScript.sol";
import {console2} from "forge-std/console2.sol";

contract PreflightShadownet is ShadownetScript {
    function run() external view onlyShadownet {
        _logHeader("00_Preflight");
        _requireConfirmationIfBroadcasting();

        address deployer = msg.sender;
        string memory selectedConfig = vm.envOr("SHADOWNET_SELECTED_CONFIG", SHADOWNET_CONFIG_PATH);
        _requireSafeConfigPath(selectedConfig);

        console2.log("deployer", deployer);
        console2.log("deployer balance", deployer.balance);
        console2.log("selected config", selectedConfig);
        console2.log("broadcast flag", vm.envOr("SHADOWNET_BROADCAST", false));
        console2.log("confirmation flag", vm.envOr("CONFIRM_SHADOWNET_DEPLOYMENT", false));
        console2.log("mainnet config selected", false);
    }
}
