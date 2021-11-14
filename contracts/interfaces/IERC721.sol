// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// minimal ERC721 interface, providing only what's needed for the dutch auction
interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint _nftId
    ) external;
}
