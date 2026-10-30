// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20, IIdentity} from "../src/interfaces.sol";
import {ClearGiveRegistry} from "../src/ClearGiveRegistry.sol";
import {ClearGiveVault} from "../src/ClearGiveVault.sol";
import {TestGoodDollar} from "../src/testnet/TestGoodDollar.sol";
import {TestIdentity} from "../src/testnet/TestIdentity.sol";

/// Deploys ClearGive with test G$ + test identity to Celo Sepolia and seeds a demo organisation.
/// forge script script/DeployTestnet.s.sol --rpc-url celo_sepolia --account deployer --broadcast
contract DeployTestnet is Script {
    string constant RECEIPT = "https://cleargive.netlify.app/demo-receipt.svg";

    function run() external {
        vm.startBroadcast();
        address me = msg.sender;

        TestGoodDollar token = new TestGoodDollar();
        TestIdentity identity = new TestIdentity();
        ClearGiveRegistry registry = new ClearGiveRegistry(IERC20(address(token)), IIdentity(address(identity)), me);

        (, address vaultAddr) = registry.createOrg(
            "Hope Community Church (demo)",
            'data:application/json,%7B%22description%22%3A%22A%20demo%20organisation%20on%20the%20Celo%20test%20network.%20Every%20donation%2C%20spend%20and%20receipt%20below%20is%20a%20real%20test-network%20transaction.%22%7D',
            me
        );
        ClearGiveVault vault = ClearGiveVault(vaultAddr);
        uint256 schoolFees = vault.addCategory("School fees");
        uint256 building = vault.addCategory("Building fund");

        token.faucet();
        token.approve(vaultAddr, type(uint256).max);
        identity.verifyMe();
        vault.donate(3_000e18, 0, "Sunday offering");
        vault.donate(2_000e18, schoolFees, "For the children's school fees");
        vault.donate(1_500e18, building, "Roof repairs");

        vault.spend(address(0xB0B5), 800e18, building, RECEIPT, "Roofing sheets from the hardware store");

        address[] memory kids = new address[](2);
        kids[0] = address(0xA11CE);
        kids[1] = address(0xCA201);
        identity.verify(kids[0]);
        identity.verify(kids[1]);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 500e18;
        amounts[1] = 500e18;
        vault.payBeneficiaries(kids, amounts, schoolFees, RECEIPT, "Term 1 school fees");

        vm.stopBroadcast();

        console.log("TestGoodDollar:", address(token));
        console.log("TestIdentity:", address(identity));
        console.log("ClearGiveRegistry:", address(registry));
        console.log("Demo vault:", vaultAddr);
    }
}
