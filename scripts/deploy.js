const hre = require("hardhat");

async function main() {
  const pool = process.env.AAVE_POOL;
  const priceFeed = process.env.CHAINLINK_ETH_USD;

  if (!pool || !priceFeed) {
    throw new Error("Set AAVE_POOL and CHAINLINK_ETH_USD in .env");
  }

  const Strategy = await hre.ethers.getContractFactory("FlashLoanOracleStrategy");
  const strategy = await Strategy.deploy(pool, priceFeed);
  await strategy.waitForDeployment();

  console.log(`FlashLoanOracleStrategy deployed to ${await strategy.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
