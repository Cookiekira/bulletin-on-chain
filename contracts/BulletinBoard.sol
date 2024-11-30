// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BulletinBoard {
    struct Post {
        uint256 id;
        // Used for client side validation
        string identifier;
        address author;
        string content;
        uint256 timestamp;
        bool isDeleted;
    }

    mapping(uint256 => Post) public posts;

    uint256 public postCount;

    event PostCreated(uint256 indexed id, string identifier, address indexed author, string content, uint256 timestamp);
    event PostDeleted(uint256 indexed id);

    function createPost(string memory _identifier, string memory _content) public {
        postCount++;
        posts[postCount] = Post(postCount, _identifier, msg.sender, _content, block.timestamp, false);

        emit PostCreated(postCount, _identifier, msg.sender, _content, block.timestamp);
    }

    function deletePost(uint256 _id) public {
        require(_id > 0 && _id <= postCount, 'Post does not exist');
        require(posts[_id].author == msg.sender, 'Only author can delete post');
        require(!posts[_id].isDeleted, 'Post already deleted');

        posts[_id].isDeleted = true;
        emit PostDeleted(_id);
    }

    function getPost(uint256 _id) public view returns (Post memory) {
        require(_id > 0 && _id <= postCount, 'Post does not exist');
        return posts[_id];
    }

    function getPostsByPage(uint256 _page, uint256 _pageSize) public view returns (Post[] memory) {
        require(_page > 0, 'Page must be greater than 0');
        require(_pageSize > 0, 'Page size must be greater than 0');
        require(postCount > 0, 'No posts exist');

        // Calculate end index with overflow check
        uint256 offset = (_page - 1) * _pageSize;
        require(offset < postCount, 'Page out of range');

        uint256 end = postCount - offset;
        uint256 start = end >= _pageSize ? end - _pageSize + 1 : 1;

        // Calculate actual size
        uint256 size = end - start + 1;
        Post[] memory result = new Post[](size);

        for (uint256 i = 0; i < size; i++) {
            result[i] = posts[end - i];
        }

        return result;
    }
}
