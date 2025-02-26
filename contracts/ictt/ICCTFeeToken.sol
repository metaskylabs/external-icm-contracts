// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ICCTFeeToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    // Override allowance to always return 1
    function allowance(address, address) public view virtual override returns (uint256) {
        return 1;
    }

    // Override transfer to mint 1 token to the given address
    function transfer(address recipient, uint256) public virtual override returns (bool) {
        _mint(recipient, 1);
        return true;
    }

    // Override transferFrom to maintain consistency
    function transferFrom(address, address recipient, uint256) public virtual override returns (bool) {
        _mint(recipient, 1);
        return true;
    }
}