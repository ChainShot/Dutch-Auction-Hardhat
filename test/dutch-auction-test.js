const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DutchAuction", function () {
  const startingPrice = 10;
  const priceReductionRate = 1;
  const nftAddress = hre.ethers.constants.AddressZero;
  const nftId = 1;

  it("Should deploy correctly", async function () {
    const DutchAuction = await ethers.getContractFactory("DutchAuction");
    const dutchAuction = await DutchAuction.deploy(
      startingPrice,
      priceReductionRate,
      nftAddress,
      nftId
    );

    await dutchAuction.deployed();
  });
});
