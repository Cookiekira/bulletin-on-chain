
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BulletinBoard {
    struct Post {
        uint256 id;
        address author;
        string content;
        uint256 timestamp;
        bool isDeleted;
    }

    mapping(uint256 => Post) public posts;
    uint256 public postCount;

    event PostCreated(uint256 indexed id, address indexed author, string content, uint256 timestamp);
    event PostDeleted(uint256 indexed id);

    function createPost(string memory _content) public {
        postCount++;
        posts[postCount] = Post(
            postCount,
            msg.sender,
            _content,
            block.timestamp,
            false
        );

        emit PostCreated(postCount, msg.sender, _content, block.timestamp);
    }

    function deletePost(uint256 _id) public {
        require(_id > 0 && _id <= postCount, "Post does not exist");
        require(posts[_id].author == msg.sender, "Only author can delete post");
        require(!posts[_id].isDeleted, "Post already deleted");

        posts[_id].isDeleted = true;
        emit PostDeleted(_id);
    }

    function getPost(uint256 _id) public view returns (Post memory) {
        require(_id > 0 && _id <= postCount, "Post does not exist");
        return posts[_id];
    }
}