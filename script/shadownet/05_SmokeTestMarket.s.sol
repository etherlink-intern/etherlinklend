// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

/* solhint-disable gas-custom-errors */

import {IMorpho, MarketParams, Id} from "morpho-blue/src/interfaces/IMorpho.sol";
import {MarketParamsLib} from "morpho-blue/src/libraries/MarketParamsLib.sol";
import {IOracle} from "morpho-blue/src/interfaces/IOracle.sol";
import {ShadownetScript} from "./ShadownetScript.sol";
import {console2} from "forge-std/console2.sol";

interface IShadownetERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SmokeTestShadownetMarket is ShadownetScript {
    using MarketParamsLib for MarketParams;

    uint256 internal constant SUPPLY_ASSETS = 1_000e18;
    uint256 internal constant COLLATERAL_ASSETS = 10e18;
    uint256 internal constant BORROW_ASSETS = 1e18;
    uint256 internal constant WITHDRAW_ASSETS = 100e18;

    function run() external onlyShadownet returns (Id marketId) {
        _logHeader("05_SmokeTestMarket");

        address morpho = _envAddressOrZero("SHADOWNET_MORPHO");
        address loanToken = _envAddressOrZero("SHADOWNET_LOAN_TOKEN");
        address collateralToken = _envAddressOrZero("SHADOWNET_COLLATERAL_TOKEN");
        address oracle = _envAddressOrZero("SHADOWNET_ORACLE");
        address irm = _envAddressOrZero("SHADOWNET_IRM");
        uint256 lltv = vm.envOr("SHADOWNET_MARKET_LLTV", uint256(0.5e18));

        _requireCode(morpho, "SHADOWNET_MORPHO");
        _requireCode(loanToken, "SHADOWNET_LOAN_TOKEN");
        _requireCode(collateralToken, "SHADOWNET_COLLATERAL_TOKEN");
        _requireCode(oracle, "SHADOWNET_ORACLE");
        _requireCode(irm, "SHADOWNET_IRM");
        _requireConservativeLltv(lltv);

        MarketParams memory params = MarketParams({
            loanToken: loanToken, collateralToken: collateralToken, oracle: oracle, irm: irm, lltv: lltv
        });

        marketId = params.id();
        uint256 oraclePrice = IOracle(oracle).price();
        require(oraclePrice != 0, "oracle price zero");
        require(IShadownetERC20(loanToken).balanceOf(msg.sender) >= SUPPLY_ASSETS, "loan balance low");
        require(IShadownetERC20(collateralToken).balanceOf(msg.sender) >= COLLATERAL_ASSETS, "collateral balance low");

        _startBroadcastIfNeeded();

        require(IShadownetERC20(loanToken).approve(morpho, type(uint256).max), "loan approve failed");
        require(IShadownetERC20(collateralToken).approve(morpho, type(uint256).max), "collateral approve failed");

        IMorpho(morpho).supply(params, SUPPLY_ASSETS, 0, msg.sender, "");
        IMorpho(morpho).supplyCollateral(params, COLLATERAL_ASSETS, msg.sender, "");
        IMorpho(morpho).borrow(params, BORROW_ASSETS, 0, msg.sender, msg.sender);
        IMorpho(morpho).repay(params, BORROW_ASSETS, 0, msg.sender, "");
        IMorpho(morpho).withdraw(params, WITHDRAW_ASSETS, 0, msg.sender, msg.sender);

        vm.stopBroadcast();

        console2.log("smoke market id");
        console2.logBytes32(Id.unwrap(marketId));
        console2.log("supply/borrow/repay/withdraw smoke", true);
        console2.log("liquidation smoke", "skipped; requires controlled unhealthy position");
    }
}
