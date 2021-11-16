// require('dotenv').config({ path: '../.env' });

import axios from 'axios';
import { ethers } from 'ethers';

import DutchAuctionArtifact from './artifacts/contracts/DutchAuction.sol/DutchAuction';
import NFTArtifact from './artifacts/contracts/Tulip.sol/Tulip';

import './index.scss';

const DUTCH_AUCTION_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const NFT_TOKEN_ID = 1;
const NFT_TOKEN_METADATA_URI =
  'https://gateway.pinata.cloud/ipfs/QmSvsqbgUe5smqdgtyPGhfF2Xcahr2kDkNr1PT8hJ7REA6';

const provider = new ethers.providers.Web3Provider(ethereum);
const signer = provider.getSigner();

async function getDutchAuctionContract() {
  const DutchAuction = new ethers.ContractFactory(
    DutchAuctionArtifact.abi,
    DutchAuctionArtifact.bytecode,
    signer
  );

  return await DutchAuction.attach(DUTCH_AUCTION_ADDRESS);
}

async function getNftTokenListings(dutchAuctionContract, nftTokenId) {
  return await dutchAuctionContract.numAuctionsForNFTToken(nftTokenId);
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

async function getNftTokenMetadata() {
  return (await axios.get(NFT_TOKEN_METADATA_URI)).data;
}

function renderNftToken(nftMetadata) {
  document.getElementById('nft-name').innerHTML = nftMetadata.name;
  document.getElementById('nft-description').innerHTML =
    nftMetadata.description;

  const nftAttributes = document.getElementById('nft-attributes');

  nftMetadata.attributes.forEach((attribute) => {
    const attributeRow = document.createElement('tr');
    attributeRow.innerHTML = `<th class="attribute">${attribute.attributeType}</th><td>${attribute.value}</td>`;
    nftAttributes.appendChild(attributeRow);
  });

  const nftImageContainer = document.getElementById('nft-image-container');
  const nftImage = document.createElement('img');
  nftImage.src = nftMetadata.image;

  nftImageContainer.appendChild(nftImage);
}

function renderNFTTokenListings(nftTokenId, nftTokenListings) {
  console.log(`TODO: implement renderNFTTokenListings()`);
  console.log(
    `  Total number of listings for token id '${nftTokenId}' = ${nftTokenListings}`
  );
}

(async function () {
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

  const dutchAuctionContract = await getDutchAuctionContract();
  const nftContract = await getNftContract(
    await dutchAuctionContract.nftAddress()
  );

  const nftTokenMetadata = await getNftTokenMetadata();

  const nftTokenListings = await getNftTokenListings(
    dutchAuctionContract,
    NFT_TOKEN_ID
  );

  renderNftToken(nftTokenMetadata);
  renderNFTTokenListings(NFT_TOKEN_ID, nftTokenListings);

  console.log(`accounts = ${JSON.stringify(accounts)}`);
  console.log(`dutchAuctionContract.address = ${dutchAuctionContract.address}`);
  console.log(`nftContract.address = ${nftContract.address}`);
  console.log(
    `nftTokenMetadata = ${JSON.stringify(nftTokenMetadata, undefined, 2)}`
  );

  nftTokenRendered = true;
})();
