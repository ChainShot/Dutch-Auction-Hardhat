import axios from 'axios';
import { ethers } from 'ethers';

import {
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

  const nftTokenListingsPromises = [];

  for (let i = 0; i < numAuctionsForNftToken.toNumber(); i++) {
    // TODO calling the public auctions() accessor fails for the token buyer, but works
    // for the token owner. By creating a separate getAuction() function, things work
    // for both. I have no idea why.

    // nftTokenListingsPromises.push(
    //   dutchAuctionContract.auctions(nftTokenId, ethers.BigNumber.from(i))
    // );

    nftTokenListingsPromises.push(
      dutchAuctionContract.getAuction(nftTokenId, ethers.BigNumber.from(i))
    );
  }

  const nftTokenListings = await Promise.all(nftTokenListingsPromises);

  return nftTokenListings.map((nftTokenListing, index) => {
    return {
      listingId: index,
      startPrice: nftTokenListing.startingPrice.toString(),
      startDate: new Date(nftTokenListing.startDate.toNumber() * 1000),
      endDate: new Date(nftTokenListing.endDate.toNumber() * 1000),
      soldPrice: nftTokenListing.soldPrice.toString(),
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
  activeListing.currentPrice = await dutchAuctionContract.currentPrice(
    nftTokenId
  );

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
  return [
    (await ethereum.request({ method: 'eth_requestAccounts' }))[0],
    await nftContract.ownerOf(nftTokenId),
    await nftContract.getApproved(nftTokenId),
    dutchAuctionContract.address,
  ].map((addr) => addr.toLowerCase());
}

function setupContractEventListeners(dutchAuctionContract, nftContract) {
  // TODO: these trigger infinite reloading...how to stop that?
  //
  // // reload browser window when token is approved
  // nftContract.on('Approval', () => {
  //   console.log('Reloading on Approval event');
  //   setTimeout(() => {
  //     location.reload();
  //   }, 5000);
  // });
  // dutchAuctionContract.on('List', () => {
  //   console.log('Reloading on List event');
  //   setTimeout(() => {
  //     location.reload();
  //   }, 5000);
  // });
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

  setupContractEventListeners(dutchAuctionContract, nftContract);

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
  if (typeof nftTokenActiveListing !== undefined) {
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

  console.log(`account = ${JSON.stringify(metamaskAccountAddr)}`);
  console.log(`dutchAuctionContract.address = ${dutchAuctionContract.address}`);
  console.log(`nftContract.address = ${nftContract.address}`);
  console.log(
    `nftTokenMetadata = ${JSON.stringify(nftTokenMetadata, undefined, 2)}`
  );

  console.log(`Owner of token id '${nftTokenId}' = ${tokenOwnerAddr}`);
})(DUTCH_AUCTION_CONTRACT_ADDR, NFT_TOKEN_METADATA_URI, NFT_TOKEN_ID);
