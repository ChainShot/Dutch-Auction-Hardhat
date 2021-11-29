import axios from 'axios';
import { ethers } from 'ethers';

import {
  renderApprovalToListingStateChange,
  renderListingToListedStateChange,
  renderNftToken,
  renderNftTokenForm,
  renderNftTokenListings,
} from './render';

import './index.scss';

import DutchAuctionArtifact from './artifacts/contracts/DutchAuction.sol/DutchAuction';
import NFTArtifact from './artifacts/contracts/Tulip.sol/Tulip';

const DUTCH_AUCTION_CONTRACT_ADDR = process.env.DUTCH_AUCTION_CONTRACT_ADDR;
const NFT_TOKEN_METADATA_URI = process.env.NFT_TOKEN_METADATA_URI;
const NFT_TOKEN_ID = process.env.NFT_TOKEN_ID;

const provider = new ethers.providers.Web3Provider(ethereum);
const signer = provider.getSigner();

async function getDutchAuctionContract(dutchAuctionContractAddr) {
  const DutchAuction = new ethers.ContractFactory(
    DutchAuctionArtifact.abi,
    DutchAuctionArtifact.bytecode,
    signer
  );

  return await DutchAuction.attach(dutchAuctionContractAddr);
}

async function getNftTokenListings(dutchAuctionContract, nftTokenId) {
  const numAuctionsForNftToken =
    await dutchAuctionContract.numAuctionsForNftToken(nftTokenId);

  console.log(
    `dutchAuctionContract.numAuctionsForNftToken(nftTokenId): dutchAuctionContract.numAuctionsForNftToken(nftTokenId) = ${numAuctionsForNftToken}, nftTokenId = ${nftTokenId.toString()}`
  );

  const nftTokenListingsPromises = [];

  for (let i = 0; i < numAuctionsForNftToken.toNumber(); i++) {
    nftTokenListingsPromises.push(
      dutchAuctionContract.auctions(nftTokenId, ethers.BigNumber.from(i))
    );
  }

  const nftTokenListings = await Promise.all(nftTokenListingsPromises);

  return nftTokenListings.map((nftTokenListing, index) => {
    const startMillis = +nftTokenListing.startDate.toString() * 1000;
    const endMillis = +nftTokenListing.endDate.toString() * 1000;

    const startDate = new Date(startMillis);
    const endDate = new Date(endMillis);

    console.log(`startMillis = ${startMillis}`);
    console.log(`endMillis = ${endMillis}`);

    console.log(`startDate = ${startDate.toLocaleString()}`);
    console.log(`endDate = ${endDate.toLocaleString()}`);

    console.log(`nftTokenListing.startPrice = ${nftTokenListing.startPrice}`);
    console.log(`nftTokenListing.soldPrice = ${nftTokenListing.soldPrice}`);

    return {
      listingId: index,
      startPrice: ethers.utils.formatEther(nftTokenListing.startPrice),
      startDate: new Date(nftTokenListing.startDate.toNumber() * 1000),
      endDate: new Date(nftTokenListing.endDate.toNumber() * 1000),
      soldPrice: ethers.utils.formatEther(nftTokenListing.soldPrice),
      soldDate: new Date(nftTokenListing.soldDate.toNumber() * 1000),
      sold: nftTokenListing.sold,
    };
  });
}

async function getNftTokenActiveListing(
  dutchAuctionContract,
  nftTokenId,
  nftTokenListings
) {
  const isListingActive = await dutchAuctionContract.isListingActive(
    nftTokenId
  );

  console.log({ isListingActive });

  if (!isListingActive) {
    return undefined;
  }

  const activeListing = nftTokenListings[nftTokenListings.length - 1];
  const currentPrice = await dutchAuctionContract.currentPrice(nftTokenId);

  activeListing.currentPrice = ethers.utils.formatEther(currentPrice);

  return activeListing;
}

async function getNftContract(nftContractAddress) {
  const signer = provider.getSigner();

  const NFT = new ethers.ContractFactory(
    NFTArtifact.abi,
    NFTArtifact.bytecode,
    signer
  );

  return await NFT.attach(nftContractAddress);
}

async function getNftTokenMetadata(nftTokenMetadataUri) {
  return (await axios.get(nftTokenMetadataUri)).data;
}

async function getAddresses(nftContract, nftTokenId, dutchAuctionContract) {
  console.log(
    `calling nftContract.ownerOf(nftTokenId): nftTokenId = ${nftTokenId.toString()}`
  );

  console.log(
    `calling nftContract.nftContract.getApproved(nftTokenId): nftTokenId = ${nftTokenId.toString()}`
  );

  return [
    (await ethereum.request({ method: 'eth_requestAccounts' }))[0],
    await nftContract.ownerOf(nftTokenId),
    await nftContract.getApproved(nftTokenId),
    dutchAuctionContract.address,
  ].map((addr) => addr.toLowerCase());
}

function setupContractEventListeners(
  dutchAuctionContract,
  nftContract,
  nftTokenId
) {
  console.log(`calling nftContract.on('Approval', ...)`);

  nftContract.on('Approval', () => {
    renderApprovalToListingStateChange(dutchAuctionContract, nftTokenId);
  });

  dutchAuctionContract.on('List', async () => {
    const nftTokenListings = await getNftTokenListings(
      dutchAuctionContract,
      nftTokenId
    );

    const nftTokenActiveListing = await getNftTokenActiveListing(
      dutchAuctionContract,
      nftTokenId,
      nftTokenListings
    );

    renderListingToListedStateChange(
      dutchAuctionContract,
      nftTokenActiveListing,
      nftTokenId
    );
  });

  // dutchAuctionContract.on('Buy', () => {
  //   console.log('Reloading on Buy event');
  //   setTimeout(() => {
  //     location.reload();
  //   }, 5000);
  // });
}

////////////////////////////////////////////
////////////////////////////////////////////

(async function (dutchAuctionContractAddr, nftTokenMetadataUri, nftTokenId) {
  const dutchAuctionContract = await getDutchAuctionContract(
    dutchAuctionContractAddr
  );

  const nftContract = await getNftContract(
    await dutchAuctionContract.nftAddress()
  );

  const nftTokenMetadata = await getNftTokenMetadata(nftTokenMetadataUri);

  const nftTokenListings = await getNftTokenListings(
    dutchAuctionContract,
    nftTokenId
  );

  const nftTokenActiveListing = await getNftTokenActiveListing(
    dutchAuctionContract,
    nftTokenId,
    nftTokenListings
  );

  // if an NFT token has an active listing, it is always the last listing in the array,
  // so we remove it from the listings array
  if (typeof nftTokenActiveListing !== 'undefined') {
    nftTokenListings.splice(-1);
  }

  const [
    metamaskAccountAddr,
    tokenOwnerAddr,
    tokenApprovedForAddr,
    dutchAuctionContractAddress,
  ] = await getAddresses(nftContract, nftTokenId, dutchAuctionContract);

  const metamaskAccountBalance = await provider.getBalance(metamaskAccountAddr);

  const needsApproval = tokenApprovedForAddr !== dutchAuctionContractAddress;

  setupContractEventListeners(dutchAuctionContract, nftContract, nftTokenId);

  renderNftToken(nftTokenMetadata);

  renderNftTokenForm({
    nftContract,
    nftTokenId,
    dutchAuctionContract,
    metamaskAccountAddr,
    metamaskAccountBalance,
    tokenOwnerAddr,
    needsApproval,
    nftTokenActiveListing,
  });

  renderNftTokenListings(nftTokenActiveListing, nftTokenListings);

  const block = await provider.getBlock();
  console.log(
    `block.number = ${block.number.toString()}, block.timestamp = ${block.timestamp.toString()}`
  );

  console.log(`account = ${JSON.stringify(metamaskAccountAddr)}`);
  console.log(`dutchAuctionContract.address = ${dutchAuctionContract.address}`);

  console.log(
    `calling nftContract.address: nftContract.address = ${nftContract.address}`
  );
  console.log(`nftContract.address = ${nftContract.address}`);
  console.log(
    `nftTokenMetadata = ${JSON.stringify(nftTokenMetadata, undefined, 2)}`
  );

  console.log(`Owner of token id '${nftTokenId}' = ${tokenOwnerAddr}`);
})(DUTCH_AUCTION_CONTRACT_ADDR, NFT_TOKEN_METADATA_URI, NFT_TOKEN_ID);
