// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

import {DeploymentGuards} from "./DeploymentGuards.sol";
import {console2} from "forge-std/console2.sol";

/// @notice Placeholder only. Confirm exact upstream Morpho deployment procedure before use.
contract DeployMorpho is DeploymentGuards {
    function run() external view {
        bool broadcast = vm.envOr("BROADCAST", false);
        string memory chainSlug = vm.envOr("CHAIN_SLUG", string("etherlink-shadownet"));
        if (broadcast) _requireConfirmed();
        console2.log("DeployMorpho placeholder; no protocol deployment or configuration performed");
        console2.log("Deployment artifacts must be recorded under:", _artifactPath(chainSlug));
    }
}
