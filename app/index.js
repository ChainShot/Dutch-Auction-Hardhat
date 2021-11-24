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

  const [
    metamaskAccountAddr,
    tokenOwnerAddr,
    tokenApprovedForAddr,
    dutchAuctionContractAddress,
  ] = await getAddresses(nftContract, nftTokenId, dutchAuctionContract);

  const metamaskAccountBalance = await provider.getBalance(metamaskAccountAddr);

  const needsApproval = tokenApprovedForAddr !== dutchAuctionContractAddress;

  const isListingActive = await dutchAuctionContract.isListingActive(
    nftTokenId
  );

  renderNftToken(nftTokenMetadata);

  const listingPrice = ethers.utils.parseEther('2000000');

  renderNftTokenForm(
    nftContract,
    nftTokenId,
    dutchAuctionContract,
    metamaskAccountAddr,
    metamaskAccountBalance,
    tokenOwnerAddr,
    needsApproval,
    isListingActive,
    listingPrice
  );

  renderNftTokenListings(nftTokenId, nftTokenListings);

  console.log(`account = ${JSON.stringify(metamaskAccountAddr)}`);
  console.log(`dutchAuctionContract.address = ${dutchAuctionContract.address}`);
  console.log(`nftContract.address = ${nftContract.address}`);
  console.log(
    `nftTokenMetadata = ${JSON.stringify(nftTokenMetadata, undefined, 2)}`
  );

  console.log(`Owner of token id '${nftTokenId}' = ${tokenOwnerAddr}`);
})(DUTCH_AUCTION_CONTRACT_ADDR, NFT_TOKEN_METADATA_URI, NFT_TOKEN_ID);
