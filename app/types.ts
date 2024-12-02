import type { BulletinBoard$Type } from '@/artifacts/contracts/BulletinBoard.sol/BulletinBoard'
import BulletinABI from '../artifacts/contracts/BulletinBoard.sol/BulletinBoard.json'

export type Bulletin = {
  id: bigint
  author: `0x${string}`
  content: string
  timestamp: bigint
  isDeleted: boolean
}

const getAddress = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const address = await import('@/ignition/deployments/chain-31337/deployed_addresses.json')
      return address['BulletinBoardModule#BulletinBoard']
    } catch (e) {
      console.error(e)
      throw new Error('Missing BULLETIN_ADDRESS in .env')
    }
  }

  if (!process.env.NEXT_PUBLIC_BULLETIN_ADDRESS) {
    throw new Error('Missing BULLETIN_ADDRESS in .env')
  }
  return process.env.NEXT_PUBLIC_BULLETIN_ADDRESS
}

export const contractConfig = {
  address: (await getAddress()) as `0x${string}`,
  abi: BulletinABI.abi as BulletinBoard$Type['abi']
} as const

export type ContractConfig = typeof contractConfig
