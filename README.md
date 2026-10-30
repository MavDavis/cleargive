# ClearGive

Transparent giving for churches and NGOs on Celo, powered by G$.

- **Public vault per organisation.** Every donation, spend and payout is stored on-chain and readable with plain view calls.
- **Receipts are mandatory.** Funds can only leave the vault with a receipt (IPFS CID or URL) attached.
- **Earmarked giving.** Donors can give to a budget category ("School fees", "Building fund"); that money can't be spent on anything else.
- **Recurring giving as Superfluid streams.** G$ streams straight into the vault; donors can stop any time.
- **Ghost-proof aid.** `payBeneficiaries` only pays wallets verified as unique humans by GoodDollar identity (GoodID). The whole batch reverts if anyone isn't.

## Layout

```
contracts/   Foundry: ClearGiveRegistry (creates orgs) + ClearGiveVault (one per org)
web/         React + Vite + wagmi/viem frontend
```

## Contracts

```bash
cd contracts
forge test                                           # unit tests
FORK_CELO=1 forge test --match-contract CeloFork     # against real G$ + GoodID on Celo

# deploy to Celo mainnet (import a key first: cast wallet import deployer --interactive)
forge script script/Deploy.s.sol --rpc-url celo --account deployer --broadcast \
  --verify --etherscan-api-key $CELOSCAN_API_KEY
```

Set `REGISTRY_OWNER` to a Safe if you want the "Reviewed" badge controlled by a multisig.

Celo addresses used (same as GoodDollar's own widgets):

| | |
|---|---|
| G$ (SuperToken) | `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` |
| GoodID identity | `0xC361A6E67822a0EDc17D899227dd9FC50BD62F42` |
| Superfluid CFAv1Forwarder | `0xcfA132E353cB4E398080B9700609bb008eceB125` |

## Test network demo (Celo Sepolia)

GoodDollar isn't deployed on Celo Sepolia, so the demo uses valueless stand-ins from `contracts/src/testnet`: `TestGoodDollar` (anyone can call `faucet()`) and `TestIdentity` (anyone can call `verifyMe()`). Superfluid streaming is hidden on testnet.

| | Celo Sepolia |
|---|---|
| ClearGiveRegistry | `0xDD4F851168392bc375e19AAF81554aaE5C82e68f` |
| Demo vault (Hope Community Church) | `0xf4dD8cE5C8aECeE8D9FFeb933B02d12c2107C1AE` |
| TestGoodDollar | `0x913E3B590D6D47eC11E4B4FB42C8f7f4C2EF8115` |
| TestIdentity | `0x6cec9d83Da181807Af6984f20b101ddbC0a29ea8` |

```bash
forge script script/DeployTestnet.s.sol --rpc-url celo_sepolia --account <name> --sender <address> --broadcast
```

The site uses testnet unless built with `VITE_NETWORK=mainnet`.

## Web

```bash
cd web
cp .env.example .env       # set VITE_REGISTRY_ADDRESS
npm install
npm run dev
```

Local fork testing: `anvil --fork-url https://forno.celo.org`, deploy with `--rpc-url http://127.0.0.1:8545`, and set `VITE_RPC_URL=http://127.0.0.1:8545`.

Receipt uploads use Pinata if `VITE_PINATA_JWT` is set. That key is visible in the browser, so scope it to `pinFileToIPFS` only and move uploads behind a small backend before wider launch. Without it, treasurers paste an `ipfs://` or `https://` link.

## Known limits (MVP)

- Ledger views return the newest 100 entries; add pagination in the UI when an org passes that.
- The list of individual stream givers comes from the Superfluid subgraph; the total monthly stream rate is read on-chain.
- Vault admin should be a Safe multisig for real organisations (`transferAdmin` → `acceptAdmin`).
- Not audited.
