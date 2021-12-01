import axios from 'axios';
import { ethers } from 'ethers';

import DutchAuctionArtifact from './artifacts/contracts/DutchAuction.sol/DutchAuction';
import NFTArtifact from './artifacts/contracts/Tulip.sol/Tulip';

let metamaskAccountAddr;
function getMetamaskAccountAddr() {
  return metamaskAccountAddr;
}

export function setMetamaskAccountAddr(_metamaskAccountAddr) {
  metamaskAccountAddr = _metamaskAccountAddr.toLowerCase();
}

export async function getMetamaskAccountBalance() {
  return await getProvider().getBalance(getMetamaskAccountAddr());
}

let provider;
export function getProvider() {
  if (typeof provider !== 'undefined') {
    return provider;
  }

  provider = new ethers.providers.Web3Provider(ethereum);

  return provider;
}

export function getSigner() {
  return getProvider().getSigner();
}

let nftTokenId;
export function getNftTokenId() {
  return nftTokenId;
}

export function setNftTokenId(_nftTokenId) {
  nftTokenId = _nftTokenId;
}

let dutchAuctionContractAddr;
let dutchAuctionContract;

export function getDutchAuctionContractAddr() {
  return dutchAuctionContractAddr;
}

export async function setDutchAuctionContractAddr(_dutchAuctionContractAddr) {
  dutchAuctionContractAddr = _dutchAuctionContractAddr.toLowerCase();

  const DutchAuction = new ethers.ContractFactory(
    DutchAuctionArtifact.abi,
    DutchAuctionArtifact.bytecode,
    getSigner()
  );

  dutchAuctionContract = await DutchAuction.attach(dutchAuctionContractAddr);

  await setNftContractAddr(await dutchAuctionContract.nftAddress());
}

export function getDutchAuctionContract() {
  return dutchAuctionContract;
}

let nftContractAddr;
let nftContract;

export function getNftContractAddr() {
  return nftContractAddr;
}

async function setNftContractAddr(_nftContractAddr) {
  nftContractAddr = _nftContractAddr.toLowerCase();

  const NFT = new ethers.ContractFactory(
    NFTArtifact.abi,
    NFTArtifact.bytecode,
    getSigner()
  );

  nftContract = await NFT.attach(nftContractAddr);
}

export function getNftContract() {
  return nftContract;
}

export async function getTokenOwnerAddr() {
  return (await nftContract.ownerOf(getNftTokenId())).toLowerCase();
}

export async function isTokenOwner() {
  return metamaskAccountAddr === (await getTokenOwnerAddr());
}

export async function getTokenApprovedForAddr() {
  return (await nftContract.getApproved(getNftTokenId())).toLowerCase();
}

let nftTokenMetadataUri;
let nftTokenMetadata;

export function getNftTokenMetadataUri() {
  return nftTokenMetadataUri;
}

export async function setNftTokenMetaDataUri(_nftTokenMetadataUri) {
  nftTokenMetadataUri = _nftTokenMetadataUri;

  nftTokenMetadata = (await axios.get(nftTokenMetadataUri)).data;
}

export function getNftTokenMetadata() {
  return nftTokenMetadata;
}

export async function dutchAuctonNeedsNftTokenApproval() {
  const dutchAuctionContractAddr = getDutchAuctionContractAddr();
  const tokenApprovedForAddr = await getTokenApprovedForAddr();

  return tokenApprovedForAddr !== dutchAuctionContractAddr;
}

export async function isListingActive() {
  return await dutchAuctionContract.isListingActive(getNftTokenId());
}

async function nftListingsToNftListingsAndActiveListing(nftTokenListings) {
  const currentPrice = await dutchAuctionContract.currentPrice(getNftTokenId());

  if (!(await isListingActive())) {
    return {
      nftTokenListings: nftTokenListings,
      activeNftTokenListing: undefined,
    };
  }

  // if an NFT token has an active listing, it is always the last listing in the array,
  // so we remove it from the listings array
  const activeNftTokenListing = nftTokenListings.splice(-1);
  activeNftTokenListing.currentPrice = ethers.utils.formatEther(currentPrice);

  return {
    nftTokenListings: nftTokenListings,
    activeNftTokenListing: activeNftTokenListing,
  };
}

export async function getNftTokenListings() {
  const dutchAuctionContract = getDutchAuctionContract();
  const nftTokenId = getNftTokenId();

  const numAuctionsForNftToken =
    await dutchAuctionContract.numAuctionsForNftToken(nftTokenId);

  const nftTokenListingsPromises = [];

  for (let i = 0; i < numAuctionsForNftToken.toNumber(); i++) {
    nftTokenListingsPromises.push(
      dutchAuctionContract.auctions(nftTokenId, ethers.BigNumber.from(i))
    );
  }

  const nftTokenListingsData = await Promise.all(nftTokenListingsPromises);

  const nftTokenListings = nftTokenListingsData.map(
    (nftTokenListing, index) => {
      return nftTokenListingToDisplayListing(nftTokenListing, index);
    }
  );

  return nftListingsToNftListingsAndActiveListing(nftTokenListings);
}

export async function getNftTokenActiveListing() {
  const dutchAuctionContract = getDutchAuctionContract();
  const nftTokenId = getNftTokenId();

  const numAuctionsForNftToken =
    await dutchAuctionContract.numAuctionsForNftToken(nftTokenId);

  if (numAuctionsForNftToken.eq(0n)) {
    return undefined;
  }

  const auctionId = numAuctionsForNftToken.sub(1n);

  // the active listing is always the last listing in the last
  const activeNftTokenListingData = await dutchAuctionContract.auctions(
    nftTokenId,
    auctionId
  );

  const currentPrice = await dutchAuctionContract.currentPrice(nftTokenId);

  const activeNftTokenListing = nftTokenListingToDisplayListing(
    activeNftTokenListingData,
    auctionId.toNumber(),
    currentPrice
  );

  if (!(await isListingActive())) {
    return undefined;
  }

  return activeNftTokenListing;
}

function nftTokenListingToDisplayListing(
  nftTokenListing,
  auctionId,
  currentPrice
) {
  const nftTokenDisplayListing = {
    auctionId: auctionId,
    startPrice: ethers.utils.formatEther(nftTokenListing.startPrice),
    startDate: bigNumberToDisplayDate(nftTokenListing.startDate),
    endDate: bigNumberToDisplayDate(nftTokenListing.endDate),
    soldPrice: ethers.utils.formatEther(nftTokenListing.soldPrice),
    soldDate: bigNumberToDisplayDate(nftTokenListing.soldDate),
    sold: nftTokenListing.sold,
  };

  if (typeof currentPrice !== 'undefined') {
    nftTokenDisplayListing.currentPrice =
      ethers.utils.formatEther(currentPrice);
  }

  return nftTokenDisplayListing;
}

function bigNumberToDisplayDate(bigNumber) {
  return (
    new Date(bigNumber.toNumber() * 1000).toISOString().split('.')[0] + 'Z'
  );
}
