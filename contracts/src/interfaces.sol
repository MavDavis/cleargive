// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice GoodDollar identity (GoodID). Returns the whitelisted root for a verified
/// unique human (or a wallet connected to one), or address(0) if not verified.
interface IIdentity {
    function getWhitelistedRoot(address account) external view returns (address);
}
