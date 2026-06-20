// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFlashLoanReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

contract MockAavePool {
    uint256 public premium;

    function setPremium(uint256 premium_) external {
        premium = premium_;
    }

    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16
    ) external {
        IFlashLoanReceiver(receiverAddress).executeOperation(asset, amount, premium, receiverAddress, params);
    }
}
