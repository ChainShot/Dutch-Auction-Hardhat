const chai = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');

require('@nomiclabs/hardhat-waffle');

chai.use(solidity);
const expect = chai.expect;

const {
  deployDutchAuction,
  deployNft,
  mintNftToken,
} = require('./test-helpers');

describe('DutchAuction', function () {
  let deployer, tokenOwner, tokenBuyer;

  const startingPrice = 10n;
  const priceDeductionRate = 1n;
  const endsAt = 1n; // units are minutes from 'now'
  const duration = 60n; // 60 seconds

  before(async function () {
    [deployer, tokenOwner, tokenBuyer] = await ethers.getSigners();
  });

  describe('constructor', function () {
    let nftContract;

    // setup NFT contract and mint NFT token for Dutch Auction contract tests
    before(async function () {
      nftContract = await deployNft();
    });

    it('should deploy correctly', async function () {
      const DutchAuction = await ethers.getContractFactory('DutchAuction');
      const dutchAuction = await DutchAuction.deploy(nftContract.address);

      await dutchAuction.deployed();

      expect(await dutchAuction.nftAddress()).to.equal(nftContract.address);
    });
  });

  describe('list', function () {
    let dutchAuctionContract;
    let nftContract;
    let nftTokenId;

    // setup NFT contract and for all Dutch Auction contract tests
    before(async function () {
      dutchAuctionContract = await deployDutchAuction();

      const nftContractAddress = await dutchAuctionContract.nftAddress();

      const NFT = await ethers.getContractFactory('Tulip');

      nftContract = await NFT.attach(nftContractAddress);
    });

    // mint new NFT token for each Dutch Auction contract test
    beforeEach(async function () {
      nftTokenId = await mintNftToken(nftContract, tokenOwner.address);

      // connect to the Dutch Auction contract as the token owner
      dutchAuctionContract = await dutchAuctionContract.connect(tokenOwner);

      // approve the Dutch Auction contract to transfer the NFT token on the owner's behalf
      const contract = await nftContract.connect(tokenOwner);
      contract.approve(dutchAuctionContract.address, nftTokenId);
    });

    it('should create NFT token listing correctly', async function () {
      // first listing has an auction id of 0
      const auctionId = ethers.BigNumber.from(0);

      // expect there are 0 auctions for a freshly minted NFT token
      expect(
        await dutchAuctionContract.numAuctionsForNFTToken(nftTokenId)
      ).to.equal(auctionId);

      const listingTxn = await dutchAuctionContract.list(
        nftTokenId,
        startingPrice,
        priceDeductionRate,
        endsAt
      );

      const auction = await dutchAuctionContract.auctions(
        nftTokenId,
        auctionId
      );

      const expectedStartsAt = (await ethers.provider.getBlock()).timestamp;

      expect(auction.startingPrice).to.equal(startingPrice);
      expect(auction.priceDeductionRate).to.equal(priceDeductionRate);
      expect(auction.startsAt).to.equal(expectedStartsAt);
      expect(auction.endsAt.sub(auction.startsAt)).to.equal(duration);
      expect(auction.sold).to.be.false;

      await expect(listingTxn)
        .to.emit(dutchAuctionContract, 'List')
        .withArgs(nftTokenId, auctionId, startingPrice);

      // after listing, expect there is 1 auction for a freshly minted NFT token
      expect(
        await dutchAuctionContract.numAuctionsForNFTToken(nftTokenId)
      ).to.equal(auctionId.add(1n));
    });

    it('should fail creating an NFT token listing for a token by a signer that does not own the token', async function () {
      // connect to the Dutch Auction contract as NOT the token owner
      dutchAuctionContract = await dutchAuctionContract.connect(tokenBuyer);

      await expect(
        dutchAuctionContract.list(
          nftTokenId,
          startingPrice,
          priceDeductionRate,
          endsAt
        )
      ).to.be.revertedWith('Only token owner can list token.');
    });

    it('should fail creating an NFT token listing for a token that already has an active listing', async function () {
      // connect to the Dutch Auction contract as the token owner
      dutchAuctionContract = await dutchAuctionContract.connect(tokenOwner);

      await dutchAuctionContract.list(
        nftTokenId,
        startingPrice,
        priceDeductionRate,
        endsAt
      );

      await expect(
        dutchAuctionContract.list(
          nftTokenId,
          startingPrice,
          priceDeductionRate,
          endsAt
        )
      ).to.be.revertedWith(
        'Cannot create new auction for NFT token that is already in an active auction.'
      );
    });
  });

  describe('buy', function () {
    // setup NFT contract and for all Dutch Auction contract tests
    before(async function () {
      dutchAuctionContract = await deployDutchAuction();

      const nftContractAddress = await dutchAuctionContract.nftAddress();

      const NFT = await ethers.getContractFactory('Tulip');

      nftContract = await NFT.attach(nftContractAddress);
    });

    // mint new NFT token for each Dutch Auction contract test
    beforeEach(async function () {
      nftTokenId = await mintNftToken(nftContract, tokenOwner.address);

      // connect to the Dutch Auction contract as the token owner
      dutchAuctionContract = await dutchAuctionContract.connect(tokenOwner);

      // approve the Dutch Auction contract to transfer the NFT token on the owner's behalf
      const contract = await nftContract.connect(tokenOwner);
      contract.approve(dutchAuctionContract.address, nftTokenId);
    });

    it('should buy an actively listed NFT token correctly', async function () {
      await dutchAuctionContract.list(
        nftTokenId,
        startingPrice,
        priceDeductionRate,
        endsAt
      );

      const auctionId =
        (await dutchAuctionContract.numAuctionsForNFTToken(nftTokenId)) - 1;

      // connect to the Dutch Auction contract as a buyer
      dutchAuctionContract = await dutchAuctionContract.connect(tokenBuyer);

      const overrides = {
        value: '11',
      };

      const buyTxn = await dutchAuctionContract.buy(nftTokenId, overrides);

      await expect(buyTxn)
        .to.emit(nftContract, 'Transfer')
        .withArgs(tokenOwner.address, tokenBuyer.address, nftTokenId);

      await expect(buyTxn)
        .to.emit(dutchAuctionContract, 'Buy')
        .withArgs(nftTokenId, auctionId, tokenBuyer.address, overrides.value);
    });

    it('should fail buying an NFT token listing when price is not met', async function () {
      // connect to the Dutch Auction contract as the token owner
      dutchAuctionContract = await dutchAuctionContract.connect(tokenOwner);

      await dutchAuctionContract.list(
        nftTokenId,
        startingPrice,
        priceDeductionRate,
        endsAt
      );

      const auctionId =
        (await dutchAuctionContract.numAuctionsForNFTToken(nftTokenId)) - 1;

      // connect to the Dutch Auction contract as a buyer
      dutchAuctionContract = await dutchAuctionContract.connect(tokenBuyer);

      const overrides = {
        value: '5',
      };

      await expect(
        dutchAuctionContract.buy(nftTokenId, overrides)
      ).to.be.revertedWith('Item listing price not met.');
    });
  });
});
