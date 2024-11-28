import type { BulletinBoard$Type } from '@/artifacts/contracts/BulletinBoard.sol/BulletinBoard'
import BulletinABI from '../artifacts/contracts/BulletinBoard.sol/BulletinBoard.json' 

export type Bulletin = {
  id: bigint
  author: string
  content: string
  timestamp: bigint
  isDeleted: boolean
}

export const contractConfig = {
  address: process.env.NEXT_PUBLIC_BULLETIN_ADDRESS as `0x${string}`,
  abi: BulletinABI.abi as unknown as BulletinBoard$Type['abi'],
} as const

export type ContractConfig = typeof contractConfig