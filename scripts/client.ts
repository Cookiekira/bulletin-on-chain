import { parseEther, formatEther } from 'viem'
import hre from 'hardhat'

async function main() {
  const [bobWalletClient, aliceWalletClient] = await hre.viem.getWalletClients()

  const publicClient = await hre.viem.getPublicClient()
  const bobBalance = await publicClient.getBalance({
    address: bobWalletClient.account.address
  })

  console.log(`Balance of ${bobWalletClient.account.address}: ${formatEther(bobBalance)} ETH`)

  const hash = await bobWalletClient.sendTransaction({
    to: aliceWalletClient.account.address,
    value: parseEther('1')
  })
  await publicClient.waitForTransactionReceipt({ hash })
}

main()
  .then(() => process.exit())
  .catch((error:unknown) => {
    console.error(error)
    process.exit(1)
  })
