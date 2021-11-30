import axios from 'axios';
import { ethers } from 'ethers';

import { getNftTokenListings, getNftTokenActiveListing } from './dutch-auction';

import {
  clearCurrentPriceTimers,
  renderApprovalToListingStateChange,
  renderListingToListedStateChange,
  renderNftToken,
  renderNftTokenForm,
  renderPreviousNftListings,
  unrenderAll,
} from './render';

import './index.scss';

import DutchAuctionArtifact from './artifacts/contracts/DutchAuction.sol/DutchAuction';
import NFTArtifact from './artifacts/contracts/Tulip.sol/Tulip';

const DUTCH_AUCTION_CONTRACT_ADDR = process.env.DUTCH_AUCTION_CONTRACT_ADDR;
const NFT_TOKEN_METADATA_URI = process.env.NFT_TOKEN_METADATA_URI;
const NFT_TOKEN_ID = process.env.NFT_TOKEN_ID;

let provider;
let signer;

async function getDutchAuctionContract(dutchAuctionContractAddr) {
  const DutchAuction = new ethers.ContractFactory(
    DutchAuctionArtifact.abi,
    DutchAuctionArtifact.bytecode,
    signer
  );

  return await DutchAuction.attach(dutchAuctionContractAddr);
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
    await nftContract.ownerOf(nftTokenId),
    await nftContract.getApproved(nftTokenId),
    dutchAuctionContract.address,
  ].map((addr) => addr.toLowerCase());
}

function setupContractEventListeners({
  dutchAuctionContract,
  nftContract,
  nftTokenId,
}) {
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

    renderListingToListedStateChange({
      dutchAuctionContract,
      nftTokenActiveListing,
      nftTokenId,
    });
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

async function handleAccountsChanged(accounts) {
  // clear all event listeners
  ethereum.removeListener('accountsChanged', handleAccountsChanged);

  // clear all timers
  clearCurrentPriceTimers();

  // if metamask account changes unrender everything and then reload the page by calling very function, ie: main()
  unrenderAll();

  const metamaskAccountAddr = accounts[0];

  await main(
    metamaskAccountAddr,
    DUTCH_AUCTION_CONTRACT_ADDR,
    NFT_TOKEN_METADATA_URI,
    NFT_TOKEN_ID
  );
}

async function main(
  metamaskAccountAddr,
  dutchAuctionContractAddr,
  nftTokenMetadataUri,
  nftTokenId
) {
  //
  // TODO: https://docs.metamask.io/guide/ethereum-provider.html#events
  //
  // handle account switching events

  // if metamask is locked this will open up the metamask dialog to enter password and
  // unlock metamask
  await ethereum.request({ method: 'eth_requestAccounts' });

  ethereum.on('accountsChanged', handleAccountsChanged);

  provider = new ethers.providers.Web3Provider(ethereum);
  signer = provider.getSigner();

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

  const [tokenOwnerAddr, tokenApprovedForAddr, dutchAuctionContractAddress] =
    await getAddresses(nftContract, nftTokenId, dutchAuctionContract);

  const metamaskAccountBalance = await provider.getBalance(metamaskAccountAddr);

  const needsApproval = tokenApprovedForAddr !== dutchAuctionContractAddress;

  setupContractEventListeners({
    dutchAuctionContract,
    nftContract,
    nftTokenId,
  });

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

  renderPreviousNftListings(nftTokenListings);

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
}

(async function (dutchAuctionContractAddr, nftTokenMetadataUri, nftTokenId) {
  const metamaskAccountAddr = (
    await ethereum.request({ method: 'eth_requestAccounts' })
  )[0];

  await main(
    metamaskAccountAddr,
    dutchAuctionContractAddr,
    nftTokenMetadataUri,
    nftTokenId
  );
})(DUTCH_AUCTION_CONTRACT_ADDR, NFT_TOKEN_METADATA_URI, NFT_TOKEN_ID);
