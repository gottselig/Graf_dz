# OTUS The Graph / AAVE / Chainlink Homework

Проект закрывает пункты домашнего задания:

- контракт `FlashLoanOracleStrategy` использует Chainlink price feed;
- в контракте реализован AAVE V3 `flashLoanSimple` flow и место для swap-стратегии через произвольный `swapTarget`;
- окружение использует Hardhat, Solidity, Web3.js;
- JS-скрипт читает цену газа, баланс, Chainlink-цену, умеет отправлять ETH и вызывать flashloan;
- добавлен The Graph subgraph для событий контракта;
- есть минимальные тесты контракта.

## Стратегия flashloan

Идея стратегии: взять актив в AAVE flashloan, сравнить цену из Chainlink с котировками DEX-агрегаторов, выполнить заранее подготовленный swap calldata, проверить, что баланс после операции покрывает `amount + premium`, затем разрешить AAVE Pool списать долг.

Практически:

1. Off-chain бот получает котировки Uniswap / 1inch.
2. Если ожидаемая прибыль больше premium, gas и slippage, бот кодирует calldata для swap.
3. Бот вызывает `requestFlashLoan(asset, amount, params)`.
4. `executeOperation` проверяет Chainlink price feed, выполняет swap и валидирует итоговый баланс.

## Установка

```bash
npm install
cp .env.example .env
```

Заполните `.env`: `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `AAVE_POOL`, `CHAINLINK_ETH_USD`.

## Проверка

```bash
npm run compile
npm test
```

## Деплой

```bash
npm run deploy:sepolia
```

После деплоя добавьте адрес в `.env` как `CONTRACT_ADDRESS`.

## Web3.js

```bash
npm run web3 -- status
npm run web3 -- send-eth 0xRecipient 0.001
npm run web3 -- flashloan 0xAsset 1000000000000000000
```

## The Graph

1. Скопируйте ABI после компиляции:

```bash
npm run copy-abi
```

2. В `subgraph.yaml` замените `source.address` на адрес задеплоенного контракта и `startBlock` на блок деплоя.

3. Сгенерируйте типы и соберите subgraph:

```bash
npm run graph:codegen
npm run graph:build
```

## Git

Для сдачи:

```bash
git init
git add .
git commit -m "Add Chainlink AAVE flashloan strategy and The Graph indexer"
git remote add origin <your-repository-url>
git push -u origin main
```
