import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'
import { nanoid } from 'nanoid'

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

      await bulletinBoard.write.createPost([nanoid(), 'Hello World'])
      const post = await bulletinBoard.read.getPost([1n])
      console.log('Post created:', post)

      expect(post.id).to.equal(1n) // id
      expect(post.content).to.equal('Hello World') // content
      expect(post.isDeleted).to.equal(false) // isDeleted
    })

    it('Should emit PostCreated event', async function () {
      const { bulletinBoard, publicClient } = await loadFixture(deployBulletinBoardFixture)

      const hash = await bulletinBoard.write.createPost([nanoid(), 'Hello World'])
      await publicClient.waitForTransactionReceipt({ hash })

      const events = await bulletinBoard.getEvents.PostCreated()
      expect(events).to.have.lengthOf(1)
      expect((events[0].args as { id: bigint; content: string }).id).to.equal(1n)
      expect((events[0].args as { id: bigint; content: string }).content).to.equal('Hello World')
    })

    it('Should delete a post', async function () {
      const { bulletinBoard } = await loadFixture(deployBulletinBoardFixture)

      await bulletinBoard.write.createPost([nanoid(), 'Hello World'])
      await bulletinBoard.write.deletePost([1n])

      const post = await bulletinBoard.read.getPost([1n])
      expect(post.isDeleted).to.equal(true) // isDeleted
    })

    describe('Pagination', function () {
      it('Should get posts by page', async function () {
        const { bulletinBoard } = await loadFixture(deployBulletinBoardFixture)

        // Create multiple posts
        await bulletinBoard.write.createPost([nanoid(), 'Post 1'])
        await bulletinBoard.write.createPost([nanoid(), 'Post 2'])
        await bulletinBoard.write.createPost([nanoid(), 'Post 3'])
        await bulletinBoard.write.createPost([nanoid(), 'Post 4'])
        await bulletinBoard.write.createPost([nanoid(), 'Post 5'])

        // Test first page
        const page1 = await bulletinBoard.read.getPostsByPage([1n, 2n])
        expect(page1).to.have.lengthOf(2)
        expect(page1[0].content).to.equal('Post 5')
        expect(page1[1].content).to.equal('Post 4')

        // Test second page
        const page2 = await bulletinBoard.read.getPostsByPage([2n, 2n])
        expect(page2).to.have.lengthOf(2)
        expect(page2[0].content).to.equal('Post 3')
        expect(page2[1].content).to.equal('Post 2')

        // Test last page with fewer items
        const page3 = await bulletinBoard.read.getPostsByPage([3n, 2n])
        expect(page3).to.have.lengthOf(1)
        expect(page3[0].content).to.equal('Post 1')
      })

      it('Should handle invalid page parameters', async function () {
        const { bulletinBoard } = await loadFixture(deployBulletinBoardFixture)

        await bulletinBoard.write.createPost([nanoid(), 'Post 1'])

        await expect(bulletinBoard.read.getPostsByPage([0n, 1n])).to.be.rejectedWith('Page must be greater than 0')

        await expect(bulletinBoard.read.getPostsByPage([1n, 0n])).to.be.rejectedWith('Page size must be greater than 0')

        await expect(bulletinBoard.read.getPostsByPage([2n, 1n])).to.be.rejectedWith('Page out of range')
      })
    })
  })
})
