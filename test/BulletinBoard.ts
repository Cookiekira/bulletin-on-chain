
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

describe('BulletinBoard', function () {
  async function deployBulletinBoardFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients()
    const bulletinBoard = await hre.viem.deployContract('BulletinBoard')
    const publicClient = await hre.viem.getPublicClient()
    return { bulletinBoard, owner, otherAccount, publicClient }
  }

  describe('Post Operations', function () {
    it('Should create a new post', async function () {
      const { bulletinBoard } = await loadFixture(deployBulletinBoardFixture)
      
      await bulletinBoard.write.createPost(['Hello World'])
      const post = await bulletinBoard.read.getPost([1n])
      console.log('Post created:', post)
      
      expect(post.id).to.equal(1n) // id
      expect(post.content).to.equal('Hello World') // content
      expect(post.isDeleted).to.equal(false) // isDeleted
    })

    it('Should emit PostCreated event', async function () {
      const { bulletinBoard, publicClient } = await loadFixture(deployBulletinBoardFixture)

      const hash = await bulletinBoard.write.createPost(['Hello World'])
      await publicClient.waitForTransactionReceipt({ hash })

      const events = await bulletinBoard.getEvents.PostCreated()
      expect(events).to.have.lengthOf(1)
      expect((events[0].args as { id: bigint, content: string }).id).to.equal(1n)
      expect((events[0].args as { id: bigint, content: string }).content).to.equal('Hello World')
    })

    it('Should delete a post', async function () {
      const { bulletinBoard } = await loadFixture(deployBulletinBoardFixture)

      await bulletinBoard.write.createPost(['Hello World'])
      await bulletinBoard.write.deletePost([1n])
      
      const post = await bulletinBoard.read.getPost([1n])
      expect(post.isDeleted).to.equal(true) // isDeleted
    })
  })
})