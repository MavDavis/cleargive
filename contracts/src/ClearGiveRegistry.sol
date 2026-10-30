// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, IIdentity} from "./interfaces.sol";
import {ClearGiveVault} from "./ClearGiveVault.sol";

/// @title ClearGiveRegistry
/// @notice Anyone can register an organisation and get a public G$ vault.
/// The registry owner can mark organisations as reviewed (a trust badge in the UI).
contract ClearGiveRegistry {
    struct Org {
        ClearGiveVault vault;
        string name;
        bool reviewed;
        uint64 createdAt;
    }

    IERC20 public immutable token;
    IIdentity public immutable identity;
    address public owner;

    Org[] internal _orgs;
    mapping(address => uint256) public orgIdByVault; // id + 1, 0 = unknown

    event OrgCreated(uint256 indexed orgId, address indexed vault, address indexed admin, string name, string metadataURI);
    event OrgReviewed(uint256 indexed orgId, bool reviewed);
    event OwnerTransferred(address indexed previous, address indexed current);

    error NotOwner();
    error UnknownOrg();
    error EmptyName();

    constructor(IERC20 token_, IIdentity identity_, address owner_) {
        token = token_;
        identity = identity_;
        owner = owner_;
        emit OwnerTransferred(address(0), owner_);
    }

    function createOrg(string calldata name, string calldata metadataURI, address admin)
        external
        returns (uint256 orgId, address vault)
    {
        if (bytes(name).length == 0) revert EmptyName();
        ClearGiveVault v = new ClearGiveVault(token, identity, admin, metadataURI);
        orgId = _orgs.length;
        _orgs.push(Org({vault: v, name: name, reviewed: false, createdAt: uint64(block.timestamp)}));
        orgIdByVault[address(v)] = orgId + 1;
        vault = address(v);
        emit OrgCreated(orgId, vault, admin, name, metadataURI);
    }

    function setReviewed(uint256 orgId, bool reviewed) external {
        if (msg.sender != owner) revert NotOwner();
        if (orgId >= _orgs.length) revert UnknownOrg();
        _orgs[orgId].reviewed = reviewed;
        emit OrgReviewed(orgId, reviewed);
    }

    function transferOwner(address newOwner) external {
        if (msg.sender != owner) revert NotOwner();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    function orgCount() external view returns (uint256) {
        return _orgs.length;
    }

    function getOrg(uint256 orgId) external view returns (Org memory) {
        if (orgId >= _orgs.length) revert UnknownOrg();
        return _orgs[orgId];
    }

    function getOrgs() external view returns (Org[] memory) {
        return _orgs;
    }
}
