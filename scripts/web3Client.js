require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Web3 } = require("web3");

const abiPath = path.join(__dirname, "..", "artifacts", "contracts", "FlashLoanOracleStrategy.sol", "FlashLoanOracleStrategy.json");
const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));

const web3 = new Web3(process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545");
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;

if (!contractAddress) {
  throw new Error("Set CONTRACT_ADDRESS in .env");
}

const contract = new web3.eth.Contract(artifact.abi, contractAddress);

function normalizePrivateKey(value) {
  if (!value) {
    throw new Error("Set PRIVATE_KEY in .env");
  }

  const trimmed = value.trim();
  const prefixed = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;

  if (!/^0x[0-9a-fA-F]{64}$/.test(prefixed)) {
    throw new Error("PRIVATE_KEY must be a 64-character hex string, with or without 0x prefix");
  }

  return prefixed;
}

async function getAccount() {
  const account = web3.eth.accounts.privateKeyToAccount(normalizePrivateKey(privateKey));
  web3.eth.accounts.wallet.add(account);
  return account;
}

async function printStatus(address) {
  const [gasPrice, balanceWei, latestPrice] = await Promise.all([
    web3.eth.getGasPrice(),
    web3.eth.getBalance(address),
    contract.methods.getLatestPrice().call()
  ]);

  console.log(`Gas price: ${web3.utils.fromWei(gasPrice, "gwei")} gwei`);
  console.log(`Balance of ${address}: ${web3.utils.fromWei(balanceWei, "ether")} ETH`);
  console.log(`Oracle price: ${latestPrice[0]} decimals=${latestPrice[1]} updatedAt=${latestPrice[2]}`);
}

async function sendEther(to, amountEth) {
  const account = await getAccount();
  const tx = {
    from: account.address,
    to,
    value: web3.utils.toWei(amountEth, "ether"),
    gas: 21000
  };

  const receipt = await web3.eth.sendTransaction(tx);
  console.log(`ETH sent. Tx hash: ${receipt.transactionHash}`);
}

async function requestFlashLoan(asset, amountWei) {
  const account = await getAccount();
  const params = {
    swapTarget: "0x0000000000000000000000000000000000000000",
    swapCalldata: "0x",
    minBalanceAfterSwap: amountWei
  };

  const data = contract.methods.requestFlashLoan(asset, amountWei, params).encodeABI();
  const tx = {
    from: account.address,
    to: contractAddress,
    data,
    gas: await contract.methods.requestFlashLoan(asset, amountWei, params).estimateGas({ from: account.address })
  };

  const receipt = await web3.eth.sendTransaction(tx);
  console.log(`Flashloan requested. Tx hash: ${receipt.transactionHash}`);
}

async function main() {
  const account = privateKey ? await getAccount() : { address: contractAddress };
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "status") {
    await printStatus(account.address);
    return;
  }

  if (command === "send-eth") {
    await sendEther(args[0], args[1]);
    return;
  }

  if (command === "flashloan") {
    await requestFlashLoan(args[0], args[1]);
    return;
  }

  throw new Error("Commands: status | send-eth <to> <amountEth> | flashloan <asset> <amountWei>");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
