// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ContractWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function balanceOf(address _token) public view returns (uint256) {
        ERC20 token = ERC20(_token);
        return token.balanceOf(owner);
    }

    function transfer(address _token, uint256 _amount) public {
        require(msg.sender == owner, "Sender is not owner");
        ERC20 token = ERC20(_token);
        token.transfer(owner, _amount);
    }
}
