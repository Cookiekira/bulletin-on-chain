# Bulletin Board DApp

A decentralized bulletin board application built with Next.js, Hardhat and wagmi where users can create and manage posts on the blockchain.

## Features

- Create and delete(actually not display) posts stored on-chain
- Infinite scrolling pagination
- Real-time updates when new posts are created
- Optimistic UI updates

## Getting Started

1. Compile the smart contracts

```bash
npx hardhat compile
```

2. Deploy the smart contracts to the local Hardhat network

```bash
npx hardhat node
```

```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Start the Next.js app

```bash
pnpm run dev
```

## Deploy contract to a testnet

1. Rename `.env.example` to `.env` and fill in the required environment variables

2. Modify the `hardhat.config.js` file to include the network configuration for the testnet

2. Deploy the smart contracts to the testnet (e.g. Sepolia)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```


