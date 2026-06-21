// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";

error DeploymentNotConfirmed();
error MissingPrivateKey();

abstract contract DeploymentGuards is Script {
    function _requireConfirmed() internal view {
        if (!vm.envOr("CONFIRM_DEPLOYMENT", false)) revert DeploymentNotConfirmed();
        if (vm.envOr("PRIVATE_KEY", uint256(0)) == 0) revert MissingPrivateKey();
    }

    function _artifactPath(string memory chainSlug) internal pure returns (string memory) {
        return string.concat("deployments/", chainSlug, "/README.md");
    }
}
