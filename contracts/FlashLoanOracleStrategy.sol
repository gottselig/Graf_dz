// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/AggregatorV3Interface.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IPool.sol";

contract FlashLoanOracleStrategy {
    error NotOwner();
    error NotPool();
    error BadInitiator();
    error InvalidOraclePrice();
    error SwapFailed();
    error EthTransferFailed();

    struct StrategyParams {
        address swapTarget;
        bytes swapCalldata;
        uint256 minBalanceAfterSwap;
    }

    address public immutable owner;
    IPool public immutable aavePool;
    AggregatorV3Interface public immutable priceFeed;

    event FlashLoanRequested(address indexed asset, uint256 amount);
    event FlashLoanExecuted(
        address indexed asset,
        uint256 amount,
        uint256 premium,
        int256 oraclePrice,
        uint256 finalBalance
    );
    event OraclePriceRead(int256 price, uint8 decimals, uint256 updatedAt);
    event EtherSent(address indexed to, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address pool_, address priceFeed_) {
        owner = msg.sender;
        aavePool = IPool(pool_);
        priceFeed = AggregatorV3Interface(priceFeed_);
    }

    receive() external payable {}

    function getLatestPrice() public returns (int256 price, uint8 decimals, uint256 updatedAt) {
        (, price, , updatedAt, ) = priceFeed.latestRoundData();
        if (price <= 0) revert InvalidOraclePrice();
        decimals = priceFeed.decimals();
        emit OraclePriceRead(price, decimals, updatedAt);
    }

    function requestFlashLoan(
        address asset,
        uint256 amount,
        StrategyParams calldata params
    ) external onlyOwner {
        emit FlashLoanRequested(asset, amount);
        aavePool.flashLoanSimple(address(this), asset, amount, abi.encode(params), 0);
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        if (msg.sender != address(aavePool)) revert NotPool();
        if (initiator != address(this)) revert BadInitiator();

        (int256 oraclePrice, , ) = getLatestPrice();
        StrategyParams memory strategy = abi.decode(params, (StrategyParams));

        if (strategy.swapTarget != address(0)) {
            (bool ok, ) = strategy.swapTarget.call(strategy.swapCalldata);
            if (!ok) revert SwapFailed();
        }

        uint256 finalBalance = IERC20(asset).balanceOf(address(this));
        if (finalBalance < strategy.minBalanceAfterSwap || finalBalance < amount + premium) {
            revert SwapFailed();
        }

        IERC20(asset).approve(address(aavePool), amount + premium);
        emit FlashLoanExecuted(asset, amount, premium, oraclePrice, finalBalance);
        return true;
    }

    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
        emit TokenWithdrawn(token, to, amount);
    }

    function sendEther(address payable to, uint256 amount) external onlyOwner {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert EthTransferFailed();
        emit EtherSent(to, amount);
    }
}
