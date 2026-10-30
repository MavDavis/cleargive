// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIdentity} from "../interfaces.sol";

/// @title TestIdentity
/// @notice Stand-in for GoodID on Celo Sepolia. Real GoodID verifies a unique human with a
/// face scan; here anyone can mark a wallet as verified so the demo flows can be tried.
contract TestIdentity is IIdentity {
    mapping(address => bool) public isVerified;

    event Verified(address indexed account);

    function verify(address account) public {
        isVerified[account] = true;
        emit Verified(account);
    }

    function verifyMe() external {
        verify(msg.sender);
    }

    function getWhitelistedRoot(address account) external view returns (address) {
        return isVerified[account] ? account : address(0);
    }
}
