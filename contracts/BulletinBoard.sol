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

    function getPostsByPage(uint256 _page, uint256 _pageSize) public view returns (Post[] memory) {
        require(_page > 0, "Page must be greater than 0");
        require(_pageSize > 0, "Page size must be greater than 0");

        uint256 start = (_page - 1) * _pageSize + 1;
        uint256 end = start + _pageSize - 1;
        if (end > postCount) {
            end = postCount;
        }
        require(start <= end, "Page out of range");

        Post[] memory result = new Post[](_pageSize);
        uint256 resultIndex = 0;

        for (uint256 i = start; i <= end; i++) {
            result[resultIndex] = posts[i];
            resultIndex++;
        }

        return result;
    }
}