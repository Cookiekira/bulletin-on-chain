import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

describe('TodoList', function () {
  async function deployTodoListFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients()
    const todoList = await hre.viem.deployContract('TodoList')
    const publicClient = await hre.viem.getPublicClient()

    return { todoList, owner, otherAccount, publicClient }
  }

  describe('Task Operations', function () {
    it('Should create a new task', async function () {
      const { todoList } = await loadFixture(deployTodoListFixture)

      await todoList.write.createTask(['Learn Solidity'])

      const task = await todoList.read.tasks([1n])
      expect(task[0]).to.equal(1n) // id
      expect(task[1]).to.equal('Learn Solidity') // content
      expect(task[2]).to.equal(false) // completed
    })

    it('Should emit TaskCreated event', async function () {
      const { todoList, publicClient } = await loadFixture(deployTodoListFixture)

      const hash = await todoList.write.createTask(['Learn Solidity'])
      await publicClient.waitForTransactionReceipt({ hash })

      const events = await todoList.getEvents.TaskCreated()
      expect(events).to.have.lengthOf(1)
      expect(events[0].args.id).to.equal(1n)
      expect(events[0].args.content).to.equal('Learn Solidity')
      expect(events[0].args.completed).to.equal(false)
    })

    it('Should toggle task completion', async function () {
      const { todoList } = await loadFixture(deployTodoListFixture)

      await todoList.write.createTask(['Learn Solidity'])
      await todoList.write.toggleTask([1n])

      const task = await todoList.read.tasks([1n])
      expect(task[2]).to.equal(true) // completed
    })

    it('Should emit TaskCompleted event', async function () {
      const { todoList, publicClient } = await loadFixture(deployTodoListFixture)

      await todoList.write.createTask(['Learn Solidity'])
      const hash = await todoList.write.toggleTask([1n])
      await publicClient.waitForTransactionReceipt({ hash })

      const events = await todoList.getEvents.TaskCompleted()
      expect(events).to.have.lengthOf(1)
      expect(events[0].args.id).to.equal(1n)
      expect(events[0].args.completed).to.equal(true)
    })

    it('Should increment taskCount', async function () {
      const { todoList } = await loadFixture(deployTodoListFixture)

      await todoList.write.createTask(['Task 1'])
      await todoList.write.createTask(['Task 2'])

      expect(await todoList.read.taskCount()).to.equal(2n)
    })
  })
})
