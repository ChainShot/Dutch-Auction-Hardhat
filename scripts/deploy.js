// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const startingPrice = 10;
  const priceReductionRate = 1;
  const nftAddress = hre.ethers.constants.AddressZero;
  const nftId = 1; 

  // We get the contract to deploy
  const DutchAuction = await hre.ethers.getContractFactory("DutchAuction");
  const dutchAuction = await DutchAuction.deploy(startingPrice, priceReductionRate, nftAddress, nftId);

  await dutchAuction.deployed();

  console.log("DutchAuction deployed to:", dutchAuction.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
