// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20, IIdentity} from "../src/interfaces.sol";
import {ClearGiveRegistry} from "../src/ClearGiveRegistry.sol";

/// forge script script/Deploy.s.sol --rpc-url celo --account deployer --broadcast \
///   --verify --etherscan-api-key $CELOSCAN_API_KEY
contract Deploy is Script {
    // Celo mainnet
    address constant G_DOLLAR = 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;
    address constant GOOD_ID = 0xC361A6E67822a0EDc17D899227dd9FC50BD62F42;

    function run() external returns (ClearGiveRegistry registry) {
        address owner = vm.envOr("REGISTRY_OWNER", msg.sender);
        vm.startBroadcast();
        registry = new ClearGiveRegistry(IERC20(G_DOLLAR), IIdentity(GOOD_ID), owner);
        vm.stopBroadcast();
        console.log("ClearGiveRegistry:", address(registry));
        console.log("Deploy block:", block.number);
    }
}
