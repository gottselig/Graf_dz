import {
  EtherSent,
  FlashLoanExecuted,
  FlashLoanRequested,
  OraclePriceRead,
  TokenWithdrawn
} from "../generated/FlashLoanOracleStrategy/FlashLoanOracleStrategy";
import {
  EtherTransfer,
  FlashLoanExecution,
  FlashLoanRequest,
  OraclePrice,
  TokenWithdrawal
} from "../generated/schema";

export function handleFlashLoanRequested(event: FlashLoanRequested): void {
  let entity = new FlashLoanRequest(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.asset = event.params.asset;
  entity.amount = event.params.amount;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}

export function handleFlashLoanExecuted(event: FlashLoanExecuted): void {
  let entity = new FlashLoanExecution(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.asset = event.params.asset;
  entity.amount = event.params.amount;
  entity.premium = event.params.premium;
  entity.oraclePrice = event.params.oraclePrice;
  entity.finalBalance = event.params.finalBalance;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}

export function handleOraclePriceRead(event: OraclePriceRead): void {
  let entity = new OraclePrice(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.price = event.params.price;
  entity.decimals = event.params.decimals;
  entity.updatedAt = event.params.updatedAt;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}

export function handleEtherSent(event: EtherSent): void {
  let entity = new EtherTransfer(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.to = event.params.to;
  entity.amount = event.params.amount;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}

export function handleTokenWithdrawn(event: TokenWithdrawn): void {
  let entity = new TokenWithdrawal(event.transaction.hash.concatI32(event.logIndex.toI32()));
  entity.token = event.params.token;
  entity.to = event.params.to;
  entity.amount = event.params.amount;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}
