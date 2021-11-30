import { ethers } from 'ethers';

export async function getNftTokenListings(dutchAuctionContract, nftTokenId) {
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

export async function getNftTokenActiveListing(
  dutchAuctionContract,
  nftTokenId,
  nftTokenListings
) {
  let currentPrice;
  try {
    currentPrice = await dutchAuctionContract.currentPrice(nftTokenId);
  } catch (error) {
    if (
      typeof error.data !== 'undefined' &&
      typeof error.data.message !== 'undefined' &&
      error.data.message.includes('No active auction for NFT token.')
    ) {
      // no-op
      return;
    } else {
      throw error;
    }
  }

  const activeListing = nftTokenListings[nftTokenListings.length - 1];

  activeListing.currentPrice = ethers.utils.formatEther(currentPrice);

  return activeListing;
}
