import { http, createConfig } from 'wagmi'
import { celo } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import type { Address } from 'viem'

// Celo mainnet — same addresses GoodDollar's own widgets use
export const G_DOLLAR: Address = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'
export const GOOD_ID: Address = '0xC361A6E67822a0EDc17D899227dd9FC50BD62F42'
export const CFA_V1_FORWARDER: Address = '0xcfA132E353cB4E398080B9700609bb008eceB125'

export const SUPERFLUID_SUBGRAPH = 'https://subgraph-endpoints.superfluid.dev/celo-mainnet/protocol-v1'

export const REGISTRY = (import.meta.env.VITE_REGISTRY_ADDRESS ?? '') as Address
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined

export const GOODDOLLAR_VERIFY_URL = 'https://wallet.gooddollar.org'
export const EXPLORER = 'https://celoscan.io'

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [injected()],
  transports: { [celo.id]: http(import.meta.env.VITE_RPC_URL || 'https://forno.celo.org') },
})
