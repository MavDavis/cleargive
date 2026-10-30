// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20, IIdentity} from "../src/interfaces.sol";
import {ClearGiveRegistry} from "../src/ClearGiveRegistry.sol";
import {ClearGiveVault} from "../src/ClearGiveVault.sol";

/// Runs against Celo mainnet state: FORK_CELO=1 forge test --match-contract CeloFork
contract CeloForkTest is Test {
    IERC20 constant G_DOLLAR = IERC20(0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A);
    address constant G_HOLDER = 0xE3441bA0863AEFBf28eca5F6fAAFb4A2B608F3A1; // large G$ balance on Celo
    IIdentity constant GOOD_ID = IIdentity(0xC361A6E67822a0EDc17D899227dd9FC50BD62F42);

    ClearGiveVault vault;
    address church = makeAddr("church");

    function setUp() public {
        if (!vm.envOr("FORK_CELO", false)) vm.skip(true);
        vm.createSelectFork("celo");
        ClearGiveRegistry registry = new ClearGiveRegistry(G_DOLLAR, GOOD_ID, address(this));
        (, address v) = registry.createOrg("Fork Chapel", "", church);
        vault = ClearGiveVault(v);
    }

    function test_realTokenAndIdentity() public {
        address donor = makeAddr("donor");
        vm.prank(G_HOLDER);
        G_DOLLAR.transfer(donor, 100 ether);
        assertFalse(vault.isVerifiedHuman(donor));

        vm.startPrank(donor);
        (bool ok,) = address(G_DOLLAR).call(abi.encodeWithSignature("approve(address,uint256)", address(vault), 100 ether));
        assertTrue(ok);
        vault.donate(100 ether, 0, "fork");
        vm.stopPrank();

        assertEq(vault.generalBalance(), 100 ether);
        vm.prank(church);
        vault.spend(church, 40 ether, 0, "ipfs://receipt", "");
        assertEq(G_DOLLAR.balanceOf(church), 40 ether);
    }
}
