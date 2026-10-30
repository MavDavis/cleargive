import { http, createConfig } from 'wagmi'
import { celo, celoSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import type { Address } from 'viem'

// The site runs on the Celo Sepolia test network until the mainnet registry is deployed.
// Set VITE_NETWORK=mainnet (and VITE_REGISTRY_ADDRESS) to switch.
export const TESTNET = import.meta.env.VITE_NETWORK !== 'mainnet'

const MAINNET = {
  chain: celo,
  rpc: 'https://forno.celo.org',
  explorer: 'https://celoscan.io',
  // same addresses GoodDollar's own widgets use
  gDollar: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A' as Address,
  goodId: '0xC361A6E67822a0EDc17D899227dd9FC50BD62F42' as Address,
  registry: (import.meta.env.VITE_REGISTRY_ADDRESS ?? '') as Address,
}

// GoodDollar is not on Celo Sepolia, so these are valueless stand-ins (contracts/src/testnet)
const SEPOLIA = {
  chain: celoSepolia,
  rpc: 'https://forno.celo-sepolia.celo-testnet.org',
  explorer: 'https://celo-sepolia.blockscout.com',
  gDollar: '0x913E3B590D6D47eC11E4B4FB42C8f7f4C2EF8115' as Address,
  goodId: '0x6cec9d83Da181807Af6984f20b101ddbC0a29ea8' as Address,
  registry: '0xDD4F851168392bc375e19AAF81554aaE5C82e68f' as Address,
}

const NET = TESTNET ? SEPOLIA : MAINNET

export const CHAIN = NET.chain
export const G_DOLLAR = NET.gDollar
export const GOOD_ID = NET.goodId
export const REGISTRY = NET.registry
export const EXPLORER = NET.explorer

// Superfluid streaming is only available on mainnet
export const CFA_V1_FORWARDER: Address = '0xcfA132E353cB4E398080B9700609bb008eceB125'
export const SUPERFLUID_SUBGRAPH = 'https://subgraph-endpoints.superfluid.dev/celo-mainnet/protocol-v1'

export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined

export const GOODDOLLAR_VERIFY_URL = 'https://wallet.gooddollar.org'

export const wagmiConfig = createConfig({
  chains: [CHAIN],
  connectors: [injected()],
  transports: {
    [celo.id]: http(import.meta.env.VITE_RPC_URL || MAINNET.rpc),
    [celoSepolia.id]: http(import.meta.env.VITE_RPC_URL || SEPOLIA.rpc),
  },
})
