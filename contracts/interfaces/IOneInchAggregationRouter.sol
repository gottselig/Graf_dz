// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOneInchAggregationRouter {
    function swap(
        address executor,
        bytes calldata desc,
        bytes calldata permit,
        bytes calldata data
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);
}
