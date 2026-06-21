// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

/* solhint-disable gas-custom-errors */

import {IMorpho, MarketParams, Id} from "morpho-blue/src/interfaces/IMorpho.sol";
import {MarketParamsLib} from "morpho-blue/src/libraries/MarketParamsLib.sol";
import {ShadownetScript} from "./ShadownetScript.sol";
import {console2} from "forge-std/console2.sol";

interface IShadownetFixedRateIrm {
    function setBorrowRate(bytes32 id, uint256 newBorrowRate) external;
}

contract CreateShadownetTestMarket is ShadownetScript {
    using MarketParamsLib for MarketParams;

    uint256 internal constant DEFAULT_TEST_LLTV = 0.5e18;
    uint256 internal constant DEFAULT_TEST_BORROW_RATE = 0.05e18 / uint256(365 days);

    function run() external onlyShadownet returns (Id marketId) {
        _logHeader("04_CreateTestMarket");

        address morpho = _envAddressOrZero("SHADOWNET_MORPHO");
        address loanToken = _envAddressOrZero("SHADOWNET_LOAN_TOKEN");
        address collateralToken = _envAddressOrZero("SHADOWNET_COLLATERAL_TOKEN");
        address oracle = _envAddressOrZero("SHADOWNET_ORACLE");
        address irm = _envAddressOrZero("SHADOWNET_IRM");
        uint256 lltv = vm.envOr("SHADOWNET_MARKET_LLTV", DEFAULT_TEST_LLTV);
        uint256 borrowRate = vm.envOr("SHADOWNET_TEST_BORROW_RATE", DEFAULT_TEST_BORROW_RATE);

        _requireCode(morpho, "SHADOWNET_MORPHO");
        _requireCode(loanToken, "SHADOWNET_LOAN_TOKEN");
        _requireCode(collateralToken, "SHADOWNET_COLLATERAL_TOKEN");
        _requireCode(oracle, "SHADOWNET_ORACLE");
        _requireCode(irm, "SHADOWNET_IRM");
        _requireConservativeLltv(lltv);
        require(borrowRate != 0, "borrow rate unset");

        MarketParams memory params = MarketParams({
            loanToken: loanToken, collateralToken: collateralToken, oracle: oracle, irm: irm, lltv: lltv
        });

        marketId = params.id();

        _startBroadcastIfNeeded();

        IMorpho(morpho).enableIrm(irm);
        IMorpho(morpho).enableLltv(lltv);
        IShadownetFixedRateIrm(irm).setBorrowRate(Id.unwrap(marketId), borrowRate);
        IMorpho(morpho).createMarket(params);

        vm.stopBroadcast();

        console2.log("market id");
        console2.logBytes32(Id.unwrap(marketId));
        console2.log("loanToken", loanToken);
        console2.log("collateralToken", collateralToken);
        console2.log("oracle", oracle);
        console2.log("irm", irm);
        console2.log("lltv", lltv);
    }
}
