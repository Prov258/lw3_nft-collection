// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    string _baseTokenURI;
    bool public presaleStarted = false;
    uint256 public presaleEnded;
    bool public _paused;
    uint256 public maxTokenIds = 20;
    uint256 public tokenIds;
    uint256 public _price = 0.01 ether;

    IWhitelist whitelist;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract currently paused");
        _;
    }

    constructor(
        string memory baseURI,
        address whitelistContract
    ) ERC721("Cryptodevs", "CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted, "Presale hasn't started yet!");
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        require(block.timestamp < presaleEnded, "Presale time ended");
        require(msg.value >= _price, "Ether sent is not correct");
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "This address is not whitelisted"
        );
        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    function publicMint() public payable onlyWhenNotPaused {
        require(tokenIds < maxTokenIds, "No tokens are left");
        require(
            block.timestamp >= presaleEnded,
            "Public mint hasn't started yet"
        );
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    function withdraw() public payable onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send ETH");
    }

    receive() external payable {}

    fallback() external payable {}
}