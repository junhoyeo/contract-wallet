// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ContractWallet {
    address public owner;

    event Received(address, uint256);
    event ExecutedTransaction(
        address _destination,
        uint256 _value,
        bytes _data,
        bytes _returnData
    );

    constructor() {
        owner = msg.sender;
    }

    function balanceOf(address _token) public view returns (uint256) {
        ERC20 token = ERC20(_token);
        return token.balanceOf(owner);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function transfer(address _recipient, uint256 _amount) public {
        require(msg.sender == owner, "Sender is not owner");
        payable(_recipient).transfer(_amount);
    }

    function transfer(
        address _recipient,
        address _token,
        uint256 _amount
    ) public {
        require(msg.sender == owner, "Sender is not owner");
        ERC20 token = ERC20(_token);
        token.transfer(_recipient, _amount);
    }

    function _isContract(address _address)
        private
        view
        returns (bool isContract)
    {
        uint32 size;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            size := extcodesize(_address)
        }
        return (size > 0);
    }

    function execute(
        address _destination,
        uint256 _value,
        bytes memory _data
    ) public returns (bytes memory) {
        require(msg.sender == owner, "Sender is not owner");
        require(_isContract(_destination), "Destination is not a contract");

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = _destination.call{
            value: _value
        }(_data);
        require(success, string(returnData));

        emit ExecutedTransaction(_destination, _value, _data, returnData);
        return returnData;
    }
}
