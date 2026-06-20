const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("FlashLoanOracleStrategy", function () {
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();

    const Oracle = await ethers.getContractFactory("MockAggregatorV3");
    const oracle = await Oracle.deploy(8, 3000_00000000n);

    const Pool = await ethers.getContractFactory("MockAavePool");
    const pool = await Pool.deploy();

    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy();

    const Strategy = await ethers.getContractFactory("FlashLoanOracleStrategy");
    const strategy = await Strategy.deploy(await pool.getAddress(), await oracle.getAddress());

    return { owner, other, oracle, pool, token, strategy };
  }

  it("reads Chainlink oracle price", async function () {
    const { strategy } = await deployFixture();

    await expect(strategy.getLatestPrice())
      .to.emit(strategy, "OraclePriceRead")
      .withArgs(3000_00000000n, 8, anyValue);
  });

  it("requests and executes an AAVE-style flashloan", async function () {
    const { pool, token, strategy } = await deployFixture();
    const strategyAddress = await strategy.getAddress();

    await pool.setPremium(5n);
    await token.mint(strategyAddress, 105n);

    await expect(
      strategy.requestFlashLoan(await token.getAddress(), 100n, {
        swapTarget: ethers.ZeroAddress,
        swapCalldata: "0x",
        minBalanceAfterSwap: 105n
      })
    )
      .to.emit(strategy, "FlashLoanRequested")
      .withArgs(await token.getAddress(), 100n)
      .and.to.emit(strategy, "FlashLoanExecuted");

    expect(await token.allowance(strategyAddress, await pool.getAddress())).to.equal(105n);
  });

  it("restricts flashloan requests to owner", async function () {
    const { other, token, strategy } = await deployFixture();

    await expect(
      strategy.connect(other).requestFlashLoan(await token.getAddress(), 100n, {
        swapTarget: ethers.ZeroAddress,
        swapCalldata: "0x",
        minBalanceAfterSwap: 0n
      })
    ).to.be.revertedWithCustomError(strategy, "NotOwner");
  });
});
