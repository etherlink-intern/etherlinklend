// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

/* solhint-disable gas-custom-errors, immutable-vars-naming */

import {IOracle} from "morpho-blue/src/interfaces/IOracle.sol";

/// @notice TESTNET-ONLY fixed-price oracle used to validate Shadownet deployment mechanics.
/// @dev Returns a Morpho-compatible price scaled by 1e36. Do not use for production markets.
contract TestOnlyFixedPriceOracle is IOracle {
    uint256 public price;
    address public immutable owner;

    event TestOnlyPriceUpdated(uint256 newPrice);

    constructor(uint256 initialPrice, address oracleOwner) {
        require(initialPrice != 0, "price zero");
        require(oracleOwner != address(0), "owner zero");

        price = initialPrice;
        owner = oracleOwner;

        emit TestOnlyPriceUpdated(initialPrice);
    }

    function setPrice(uint256 newPrice) external {
        require(msg.sender == owner, "not owner");
        require(newPrice != 0, "price zero");

        price = newPrice;

        emit TestOnlyPriceUpdated(newPrice);
    }
}
