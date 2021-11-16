# Dutch Auction Dapp

This Dutch Auction Dapp is built with [Hardhat](https://hardhat.org/).

## Project Layout

There are three top-level folders:

1. `./app` - contains the front-end application
2. `./contracts` - contains the solidity contract
5. `./nfts` - contains nft assets and metadata
3. `./tasks` - contains hardhat tasks
4. `./tests` - contains tests for the solidity contract

## Setup

Install dependencies in the top-level directory with `npm install`.

After you have installed hardhat locally, you can use commands to test and compile the contracts, among other things. To learn more about these commands run `npx hardhat help`.

Compile the contracts using `npx hardhat compile`. The artifacts will be placed in the `/app` folder, which will make it available to the front-end. This path configuration can be found in the `hardhat.config.js` file.

## Front-End

To run the front-end application move into the `app` folder and run `npx parcel index.html`.

You can learn more about Parcel [here](https://parceljs.org/).
