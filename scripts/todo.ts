import TodoList from '../artifacts/contracts/TodoList.sol/TodoList.json'
import hre from 'hardhat'
import deployedAddress from  '../ignition/deployments/chain-11155111/deployed_addresses.json'



async function main() {
  // Create wallet client and public client
  const [bobWalletClient] = await hre.viem.getWalletClients()
  const publicClient = await hre.viem.getPublicClient()
  const todoListAddress = deployedAddress["TodoListModule#TodoList"] as `0x${string}`


  // Create a new task
  const createTaskHash = await bobWalletClient.writeContract({
    address: todoListAddress,
    abi: TodoList.abi,
    functionName: 'createTask',
    args: ['My first task']
  })

  await publicClient.waitForTransactionReceipt({ hash: createTaskHash })
  
  console.log('Task created')

  // Toggle the task completion status
  const toggleTaskHash = await bobWalletClient.writeContract({
    address: todoListAddress,
    abi: TodoList.abi,
    functionName: 'toggleTask',
    args: [1n]
  })
  await publicClient.waitForTransactionReceipt({ hash: toggleTaskHash })
  console.log('Task toggled')
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })