import Bulletin from '../artifacts/contracts/BulletinBoard.sol/BulletinBoard.json'
import hre from 'hardhat'

async function main() {
  // Create wallet client and public client
  const [bobWalletClient] = await hre.viem.getWalletClients()
  const publicClient = await hre.viem.getPublicClient()
  const addressFilePath = '../ignition/deployments/chain-11155111/deployed_addresses.json'
  const deployedAddress = await import(addressFilePath)
  const bulletinAddress = deployedAddress['BulletinBoardModule#BulletinBoard'] as `0x${string}`

  // Create a new post - Pass content as a single string
  const createPostHash = await bobWalletClient.writeContract({
    address: bulletinAddress,
    abi: Bulletin.abi,
    functionName: 'createPost',
    args: ['My first post: This is the content of my first post']
  })

  await publicClient.waitForTransactionReceipt({ hash: createPostHash })

  console.log('Post created')

  // Toggle the post visibility
  const deletePost = await bobWalletClient.writeContract({
    address: bulletinAddress,
    abi: Bulletin.abi,
    functionName: 'deletePost',
    args: [1n]
  })
  await publicClient.waitForTransactionReceipt({ hash: deletePost })
  console.log('Post visibility toggled')
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
