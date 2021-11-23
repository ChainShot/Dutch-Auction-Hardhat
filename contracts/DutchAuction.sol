// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

import "./Tulip.sol";

contract DutchAuction {
    using Counters for Counters.Counter;

    event List(uint indexed tokenId, uint indexed auctionId, uint indexed amount);
    event Buy(uint indexed tokenId, uint indexed auctionId, address indexed buyer, uint amount);

    address public nftAddress;

    struct Auction {
        uint startingPrice;
        uint priceDeductionRate;
        uint startsAt;
        uint endsAt;
        bool sold;
    }

    // map NFT tokens ids to number of auctions for that token id
    mapping(uint => Counters.Counter) private _numAuctionsForNftToken;

    // map NFT token ids => auction ids => auction
    mapping(uint => mapping(uint => Auction)) public auctions;

    constructor(address _nftAddress) {
        nftAddress = _nftAddress;
    }

    function numAuctionsForNftToken(uint tokenId) public view returns (uint) {
        return _numAuctionsForNftToken[tokenId].current();
    }

    function list(uint tokenId, uint _startingPrice, uint _priceDeductionRate, uint _endsAt) external
          isTokenOwner(tokenId, "Only token owner can list token.")
          isNotActive(tokenId) {

        uint auctionId = numAuctionsForNftToken(tokenId);

        auctions[tokenId][auctionId] = Auction({
            startingPrice: _startingPrice,
            priceDeductionRate: _priceDeductionRate,
            startsAt: block.timestamp,
            endsAt: block.timestamp + _endsAt * 1 minutes,
            sold: false
        });

        _numAuctionsForNftToken[tokenId].increment();

        emit List(tokenId, auctionId, _startingPrice);
    }

    function buy(uint tokenId) external payable isActive(tokenId) {
        require(msg.sender != Tulip(nftAddress).ownerOf(tokenId), "Buyer is already owner.");

        uint auctionId = numAuctionsForNftToken(tokenId) - 1;

        uint timeElapsed = block.timestamp - auctions[tokenId][auctionId].startsAt;
        uint deduction = auctions[tokenId][auctionId].priceDeductionRate * timeElapsed;
        uint price = auctions[tokenId][auctionId].startingPrice - deduction;

        require(msg.value >= price, "Item listing price not met.");

        Tulip tulip = Tulip(nftAddress);

        // does the precise order of the code below matter here? could there be any
        // re-entrancy issues?
        //
        // remember the checks-effects pattern
        auctions[tokenId][auctionId].sold = true;
        payable(tulip.ownerOf(tokenId)).transfer(msg.value);
        tulip.safeTransferFrom(tulip.ownerOf(tokenId), msg.sender, tokenId);

        emit Buy(tokenId, auctionId, msg.sender, msg.value);
    }

    function isListingActive(uint tokenId) public view returns (bool) {
        uint auctionIndex = numAuctionsForNftToken(tokenId);

        if (auctionIndex == 0) {
            return false;
        }

        uint auctionId = auctionIndex - 1;

        return !auctions[tokenId][auctionId].sold && block.timestamp < auctions[tokenId][auctionId].endsAt;
    }

    modifier isTokenOwner(uint tokenId, string memory errorMessage) {
        require(msg.sender == Tulip(nftAddress).ownerOf(tokenId), errorMessage);
        _;
    }

    modifier isActive(uint tokenId) {
        require(isListingActive(tokenId), "No active auction for NFT token.");
        _;
    }

    modifier isNotActive(uint tokenId) {
        require(
            !isListingActive(tokenId),
            "Cannot create new auction for NFT token that is already in an active auction."
        );
        _;
    }
}