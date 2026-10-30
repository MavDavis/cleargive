// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20, IIdentity} from "../src/interfaces.sol";
import {ClearGiveRegistry} from "../src/ClearGiveRegistry.sol";
import {ClearGiveVault} from "../src/ClearGiveVault.sol";

contract MockToken is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockIdentity is IIdentity {
    mapping(address => address) public roots;

    function verify(address account) external {
        roots[account] = account;
    }

    function getWhitelistedRoot(address account) external view returns (address) {
        return roots[account];
    }
}

contract ClearGiveTest is Test {
    MockToken token;
    MockIdentity identity;
    ClearGiveRegistry registry;
    ClearGiveVault vault;

    address owner = makeAddr("owner");
    address church = makeAddr("church");
    address treasurer = makeAddr("treasurer");
    address donor = makeAddr("donor");
    address supplier = makeAddr("supplier");
    address alice = makeAddr("alice");
    address ghost = makeAddr("ghost");

    uint256 schoolFees;

    function setUp() public {
        token = new MockToken();
        identity = new MockIdentity();
        registry = new ClearGiveRegistry(token, identity, owner);

        (, address v) = registry.createOrg("Grace Chapel", "ipfs://meta", church);
        vault = ClearGiveVault(v);

        vm.startPrank(church);
        schoolFees = vault.addCategory("School fees");
        vault.setManager(treasurer, true);
        vm.stopPrank();

        token.mint(donor, 1_000 ether);
        vm.prank(donor);
        token.approve(address(vault), type(uint256).max);
        identity.verify(donor);
        identity.verify(alice);
    }

    function test_registry_tracksOrg() public view {
        assertEq(registry.orgCount(), 1);
        assertEq(address(registry.getOrg(0).vault), address(vault));
        assertEq(registry.orgIdByVault(address(vault)), 1);
        assertEq(vault.admin(), church);
    }

    function test_donate_earmarksCategory() public {
        vm.expectEmit(true, true, false, true, address(vault));
        emit ClearGiveVault.Donated(donor, schoolFees, 100 ether, true, "for kids");
        vm.prank(donor);
        vault.donate(100 ether, schoolFees, "for kids");

        assertEq(vault.earmarked(schoolFees), 100 ether);
        assertEq(vault.generalBalance(), 0);
        assertEq(vault.totalDonated(), 100 ether);
    }

    function test_streamedFunds_landInGeneral() public {
        token.mint(address(vault), 50 ether); // what a Superfluid stream looks like to the vault
        assertEq(vault.generalBalance(), 50 ether);
    }

    function test_spend_requiresReceipt() public {
        vm.prank(donor);
        vault.donate(10 ether, 0, "");
        vm.prank(treasurer);
        vm.expectRevert(ClearGiveVault.ReceiptRequired.selector);
        vault.spend(supplier, 1 ether, 0, "", "chairs");
    }

    function test_spend_onlyManager() public {
        vm.prank(donor);
        vm.expectRevert(ClearGiveVault.NotManager.selector);
        vault.spend(supplier, 1 ether, 0, "ipfs://r", "");
    }

    function test_spend_usesEarmarkThenGeneral() public {
        vm.startPrank(donor);
        vault.donate(30 ether, schoolFees, "");
        vault.donate(20 ether, 0, "");
        vm.stopPrank();

        vm.prank(treasurer);
        vault.spend(supplier, 40 ether, schoolFees, "ipfs://invoice", "term 1 fees");

        assertEq(token.balanceOf(supplier), 40 ether);
        assertEq(vault.earmarked(schoolFees), 0);
        assertEq(vault.generalBalance(), 10 ether);
        assertEq(vault.totalSpent(), 40 ether);
    }

    function test_spend_cannotRaidOtherEarmarks() public {
        uint256 building;
        vm.prank(church);
        building = vault.addCategory("Building fund");
        vm.prank(donor);
        vault.donate(100 ether, building, "");

        vm.prank(treasurer);
        vm.expectRevert(abi.encodeWithSelector(ClearGiveVault.InsufficientFunds.selector, 0, 1 ether));
        vault.spend(supplier, 1 ether, schoolFees, "ipfs://r", "");
    }

    function test_payBeneficiaries_onlyVerifiedHumans() public {
        vm.prank(donor);
        vault.donate(100 ether, schoolFees, "");

        address[] memory to = new address[](2);
        uint256[] memory amounts = new uint256[](2);
        to[0] = alice;
        to[1] = ghost;
        amounts[0] = 10 ether;
        amounts[1] = 10 ether;

        vm.prank(treasurer);
        vm.expectRevert(abi.encodeWithSelector(ClearGiveVault.NotVerifiedHuman.selector, ghost));
        vault.payBeneficiaries(to, amounts, schoolFees, "ipfs://list", "");

        identity.verify(ghost);
        vm.prank(treasurer);
        vault.payBeneficiaries(to, amounts, schoolFees, "ipfs://list", "term 1");

        assertEq(token.balanceOf(alice), 10 ether);
        assertEq(vault.totalToBeneficiaries(), 20 ether);
        assertEq(vault.uniqueBeneficiaries(), 2);
        ClearGiveVault.Payout[] memory payouts = vault.getPayouts(0);
        assertEq(payouts.length, 2);
        assertEq(payouts[1].beneficiary, ghost);
        assertEq(vault.getSpends(0, 10)[0].beneficiaryCount, 2);
        assertEq(vault.earmarked(schoolFees), 80 ether);
    }

    function test_ledger_paginatesNewestFirst() public {
        vm.startPrank(donor);
        vault.donate(1 ether, 0, "first");
        vault.donate(2 ether, 0, "second");
        vault.donate(3 ether, schoolFees, "third");
        vm.stopPrank();

        assertEq(vault.donationCount(), 3);
        assertEq(vault.uniqueVerifiedDonors(), 1);
        ClearGiveVault.Donation[] memory page = vault.getDonations(0, 2);
        assertEq(page.length, 2);
        assertEq(page[0].memo, "third");
        assertEq(page[1].memo, "second");
        assertEq(vault.getDonations(2, 10)[0].memo, "first");
        assertEq(vault.getDonations(5, 10).length, 0);

        vm.prank(treasurer);
        vault.spend(supplier, 1 ether, 0, "ipfs://r", "chairs");
        ClearGiveVault.Spend memory sp = vault.getSpends(0, 1)[0];
        assertEq(sp.to, supplier);
        assertEq(sp.receiptURI, "ipfs://r");
    }

    function test_adminTransfer_twoStep() public {
        address safe = makeAddr("safe");
        vm.prank(church);
        vault.transferAdmin(safe);
        assertEq(vault.admin(), church);
        vm.prank(safe);
        vault.acceptAdmin();
        assertEq(vault.admin(), safe);
    }

    function test_setReviewed_onlyOwner() public {
        vm.expectRevert(ClearGiveRegistry.NotOwner.selector);
        registry.setReviewed(0, true);
        vm.prank(owner);
        registry.setReviewed(0, true);
        assertTrue(registry.getOrg(0).reviewed);
    }
}
