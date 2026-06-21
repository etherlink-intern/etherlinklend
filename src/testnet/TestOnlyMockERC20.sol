// SPDX-License-Identifier: GPL-2.0-or-later OR BUSL-1.1
pragma solidity 0.8.24;

/* solhint-disable gas-custom-errors, immutable-vars-naming */

/// @notice TESTNET-ONLY ERC20 used to validate Shadownet deployment mechanics.
/// @dev This mock is not a production asset and must never be used for mainnet market configuration.
contract TestOnlyMockERC20 {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public totalSupply;
    address public immutable owner;

    mapping(address account => uint256) public balanceOf;
    mapping(address account => mapping(address spender => uint256)) public allowance;

    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);

    constructor(string memory tokenName, string memory tokenSymbol, uint8 tokenDecimals, address tokenOwner) {
        require(bytes(tokenName).length != 0, "name empty");
        require(bytes(tokenSymbol).length != 0, "symbol empty");
        require(_containsTestMarker(tokenName) || _containsTestMarker(tokenSymbol), "missing TEST/MOCK marker");
        require(tokenOwner != address(0), "owner zero");

        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimals;
        owner = tokenOwner;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "not owner");
        require(to != address(0), "mint to zero");

        totalSupply += amount;
        balanceOf[to] += amount;

        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);

        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "insufficient allowance");

        allowance[from][msg.sender] = allowed - amount;
        _transfer(from, to, amount);

        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "transfer to zero");
        require(balanceOf[from] >= amount, "insufficient balance");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
    }

    function _containsTestMarker(string memory value) internal pure returns (bool) {
        bytes memory data = bytes(value);
        for (uint256 i; i + 3 < data.length; ++i) {
            if (
                data[i] == "M" && data[i + 1] == "O" && data[i + 2] == "C" && data[i + 3] == "K" || data[i] == "T"
                    && data[i + 1] == "E" && data[i + 2] == "S" && data[i + 3] == "T"
            ) {
                return true;
            }
        }
        return false;
    }
}
