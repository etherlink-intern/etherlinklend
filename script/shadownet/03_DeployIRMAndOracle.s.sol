// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

/* solhint-disable gas-custom-errors */

import {FixedRateIrm} from "morpho-blue-irm/src/fixed-rate-irm/FixedRateIrm.sol";
import {TestOnlyFixedPriceOracle} from "../../src/testnet/TestOnlyFixedPriceOracle.sol";
import {ShadownetScript} from "./ShadownetScript.sol";
import {console2} from "forge-std/console2.sol";

contract DeployShadownetIRMAndOracle is ShadownetScript {
    uint256 internal constant TEST_ONLY_PRICE = 1e36;

    function run() external onlyShadownet returns (address irm, address oracle) {
        _logHeader("03_DeployIRMAndOracle");

        address oracleOwner = _envOrDeployer("MOCK_ORACLE_OWNER", msg.sender);
        _requireNonZero(oracleOwner, "MOCK_ORACLE_OWNER");

        address pyth = _envAddressOrZero("PYTH_CONTRACT_ADDRESS");
        address redstone = _envAddressOrZero("REDSTONE_ADAPTER_ADDRESS");
        require(pyth == address(0) && redstone == address(0), "verified oracle mode not configured");

        _startBroadcastIfNeeded();

        FixedRateIrm deployedIrm = new FixedRateIrm();
        TestOnlyFixedPriceOracle deployedOracle = new TestOnlyFixedPriceOracle(TEST_ONLY_PRICE, oracleOwner);

        vm.stopBroadcast();

        irm = address(deployedIrm);
        oracle = address(deployedOracle);

        console2.log("FixedRateIrm", irm);
        console2.log("TEST_ONLY_FIXED_PRICE_ORACLE", oracle);
        console2.log("oracle price", TEST_ONLY_PRICE);
    }
}
