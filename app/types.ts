import type { BulletinBoard$Type } from '@/artifacts/contracts/BulletinBoard.sol/BulletinBoard'
import BulletinABI from '../artifacts/contracts/BulletinBoard.sol/BulletinBoard.json'

export type Bulletin = {
  id: bigint
  author: `0x${string}`
  content: string
  timestamp: bigint
  isDeleted: boolean
}

const isDevelopment = process.env.NODE_ENV === 'development'

const getAddress = async () => {
  try {
    const filePath = '@/ignition/deployments/chain-31337/deployed_addresses.json'
    const address = await import(filePath)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- For passign CI
    return address['BulletinBoardModule#BulletinBoard']
  } catch (e) {
    console.error(e)
    throw new Error('Missing BULLETIN_ADDRESS in .env')
  }
}

const address = isDevelopment ? await getAddress() : process.env.NEXT_PUBLIC_BULLETIN_ADDRESS

if (!address) {
  throw new Error('Missing BULLETIN_ADDRESS in .env')
}

export const contractConfig = {
  address: address as `0x${string}`,
  abi: BulletinABI.abi as BulletinBoard$Type['abi']
} as const

export type ContractConfig = typeof contractConfig
