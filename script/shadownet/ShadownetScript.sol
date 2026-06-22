// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

abstract contract ShadownetScript is Script {
    uint256 internal constant ETHERLINK_SHADOWNET_CHAIN_ID = 127823;
    uint256 internal constant ETHERLINK_MAINNET_CHAIN_ID = 42793;
    uint256 internal constant WAD = 1e18;
    string internal constant SHADOWNET_CONFIG_PATH = "config/chains/etherlink-shadownet.json";
    string internal constant MARKET_CONFIG_PATH = "config/markets/shadownet-test-market.json";

    error WrongChain(uint256 actualChainId);
    error MainnetForbidden();
    error ConfirmationRequired();
    error MissingPrivateKey();
    error MissingEnv(string name);
    error ZeroAddress(string name);
    error MissingCode(string name, address target);
    error UnsafeLltv(uint256 lltv);
    error EmptyString(string name);
    error MainnetConfigForbidden(string selectedConfig);

    modifier onlyShadownet() {
        _requireShadownet();
        _;
    }

    function _requireShadownet() internal view {
        if (block.chainid == ETHERLINK_MAINNET_CHAIN_ID) revert MainnetForbidden();
        if (block.chainid != ETHERLINK_SHADOWNET_CHAIN_ID) revert WrongChain(block.chainid);
    }

    function _requireSafeConfigPath(string memory selectedConfig) internal pure {
        if (bytes(selectedConfig).length == 0) revert EmptyString("SHADOWNET_SELECTED_CONFIG");
        if (_contains(selectedConfig, "mainnet")) revert MainnetConfigForbidden(selectedConfig);
    }

    function _requireConfirmationIfBroadcasting() internal view {
        bool broadcasting = vm.envOr("SHADOWNET_BROADCAST", false);
        if (!broadcasting) return;

        if (!vm.envOr("CONFIRM_SHADOWNET_DEPLOYMENT", false)) revert ConfirmationRequired();
        if (vm.envOr("PRIVATE_KEY", uint256(0)) == 0) revert MissingPrivateKey();
    }

    function _startBroadcastIfNeeded() internal {
        _requireConfirmationIfBroadcasting();

        uint256 privateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (privateKey != 0) vm.startBroadcast(privateKey);
        else vm.startBroadcast();
    }

    function _envAddressOrZero(string memory name) internal view returns (address value) {
        value = vm.envOr(name, address(0));
    }

    function _envOrDeployer(string memory name, address deployer) internal view returns (address value) {
        value = vm.envOr(name, address(0));
        if (value == address(0)) value = deployer;
    }

    function _requireNonZero(address value, string memory name) internal pure {
        if (value == address(0)) revert ZeroAddress(name);
    }

    function _requireCode(address target, string memory name) internal view {
        _requireNonZero(target, name);
        if (target.code.length == 0) revert MissingCode(name, target);
    }

    function _requireConservativeLltv(uint256 lltv) internal pure {
        if (lltv == 0 || lltv > 0.8e18) revert UnsafeLltv(lltv);
    }

    function _logHeader(string memory name) internal view {
        console2.log("=== Etherlink Shadownet phase ===");
        console2.log(name);
        console2.log("chainId", block.chainid);
        console2.log("config", SHADOWNET_CONFIG_PATH);
    }

    function _contains(string memory haystack, string memory needle) internal pure returns (bool) {
        bytes memory source = bytes(haystack);
        bytes memory target = bytes(needle);
        if (target.length == 0 || target.length > source.length) return false;

        for (uint256 i; i <= source.length - target.length; ++i) {
            bool matched = true;
            for (uint256 j; j < target.length; ++j) {
                if (source[i + j] != target[j]) {
                    matched = false;
                    break;
                }
            }
            if (matched) return true;
        }
        return false;
    }
}
