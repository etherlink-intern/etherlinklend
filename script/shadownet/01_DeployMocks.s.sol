// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

import {ShadownetScript} from "./ShadownetScript.sol";
import {TestOnlyMockERC20} from "../../src/testnet/TestOnlyMockERC20.sol";
import {console2} from "forge-std/console2.sol";

contract DeployShadownetMocks is ShadownetScript {
    uint256 internal constant TEST_MINT = 1_000_000e18;

    function run() external onlyShadownet returns (address loanToken, address collateralToken) {
        _logHeader("01_DeployMocks");

        address deployer = msg.sender;
        address testAccount = _envAddressOrZero("SHADOWNET_TEST_ACCOUNT");

        _startBroadcastIfNeeded();

        // TESTNET ONLY: these mock tokens are not production assets.
        TestOnlyMockERC20 loan = new TestOnlyMockERC20("MOCK TEST Loan Token", "MOCK_LOAN", 18, deployer);
        TestOnlyMockERC20 collateral =
            new TestOnlyMockERC20("MOCK TEST Collateral Token", "MOCK_COLLATERAL", 18, deployer);

        loan.mint(deployer, TEST_MINT);
        collateral.mint(deployer, TEST_MINT);
        if (testAccount != address(0)) {
            loan.mint(testAccount, TEST_MINT / 100);
            collateral.mint(testAccount, TEST_MINT / 100);
        }

        vm.stopBroadcast();

        loanToken = address(loan);
        collateralToken = address(collateral);

        console2.log("MOCK_LOAN", loanToken);
        console2.log("MOCK_COLLATERAL", collateralToken);
        console2.log("testnet only", true);
    }
}
