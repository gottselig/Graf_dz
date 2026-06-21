# OTUS The Graph / AAVE / Chainlink Homework

Проект закрывает пункты домашнего задания:

- контракт `FlashLoanOracleStrategy` использует Chainlink price feed;
- в контракте реализован AAVE V3 `flashLoanSimple` flow и место для swap-стратегии через произвольный `swapTarget`;
- окружение использует Hardhat, Solidity, ethers.js вместо Web3.js;
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

Заполните `.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT
AAVE_POOL=0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
CHAINLINK_ETH_USD=0x694AA1769357215DE4FAC081bf1f309aDC325306
```

## Проверка

```bash
npm run compile
npm test
npm run copy-abi
npm run graph:codegen
npm run graph:build
```

Локальные тесты используют mock-контракты `MockAggregatorV3`, `MockAavePool` и `MockERC20`, поэтому для них не нужны реальные AAVE или Chainlink endpoints.

## Деплой

```bash
npm run deploy:sepolia
```

После деплоя добавьте адрес в `.env` как `CONTRACT_ADDRESS`.

## ethers.js

Скрипт `scripts/ethersClient.js` работает с контрактом через ethers.js:

```bash
npm run ethers -- status
npm run ethers -- send-eth 0xRecipient 0.001
npm run ethers -- flashloan 0xAsset 1000000000000000000
```

Команда `status` читает текущую цену газа, ETH-баланс аккаунта и Chainlink oracle price из контракта.

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
