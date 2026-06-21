// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

/* solhint-disable gas-custom-errors, no-inline-assembly */

import {ShadownetScript} from "./ShadownetScript.sol";
import {console2} from "forge-std/console2.sol";

contract DeployShadownetMorphoBlue is ShadownetScript {
    string internal constant MORPHO_ARTIFACT = "Morpho.sol:Morpho";

    function run() external onlyShadownet returns (address morpho) {
        _logHeader("02_DeployMorphoBlue");

        address existingMorpho = _envAddressOrZero("EXISTING_SHADOWNET_MORPHO");
        if (existingMorpho != address(0)) {
            _requireCode(existingMorpho, "EXISTING_SHADOWNET_MORPHO");
            console2.log("using existing intended Shadownet Morpho", existingMorpho);
            return existingMorpho;
        }

        address owner = _envOrDeployer("TEST_MARKET_OWNER", msg.sender);
        _requireNonZero(owner, "TEST_MARKET_OWNER");

        _startBroadcastIfNeeded();

        bytes memory creationCode = abi.encodePacked(vm.getCode(MORPHO_ARTIFACT), abi.encode(owner));
        assembly ("memory-safe") {
            morpho := create(0, add(creationCode, 0x20), mload(creationCode))
        }
        require(morpho != address(0), "Morpho deploy failed");

        vm.stopBroadcast();

        console2.log("Morpho", morpho);
        console2.log("constructor owner", owner);
        console2.log("artifact", MORPHO_ARTIFACT);
    }
}
