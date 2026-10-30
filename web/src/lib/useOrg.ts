import { useReadContract, useReadContracts } from 'wagmi'
import { registryAbi, vaultAbi } from '../abi'
import { REGISTRY } from '../config'

export interface OrgMetadata {
  description?: string
  website?: string
}

/** Metadata is stored on-chain as a data: URI (or any URL serving JSON). */
export function parseMetadata(uri: string | undefined): OrgMetadata {
  if (!uri?.startsWith('data:application/json,')) return {}
  try {
    return JSON.parse(decodeURIComponent(uri.slice('data:application/json,'.length)))
  } catch {
    return {}
  }
}

export function encodeMetadata(meta: OrgMetadata): string {
  return `data:application/json,${encodeURIComponent(JSON.stringify(meta))}`
}

export function useOrg(id: bigint) {
  const org = useReadContract({
    address: REGISTRY,
    abi: registryAbi,
    functionName: 'getOrg',
    args: [id],
  })
  const vault = org.data?.vault
  const fields = [
    'admin',
    'metadataURI',
    'categories',
    'generalBalance',
    'totalDonated',
    'totalSpent',
    'totalToBeneficiaries',
  ] as const
  const reads = useReadContracts({
    allowFailure: false,
    query: { enabled: Boolean(vault) },
    contracts: fields.map((functionName) => ({ address: vault, abi: vaultAbi, functionName })),
  })
  const [admin, metadataURI, categories, generalBalance, totalDonated, totalSpent, totalToBeneficiaries] =
    (reads.data ?? []) as [
      `0x${string}`,
      string,
      string[],
      bigint,
      bigint,
      bigint,
      bigint,
    ]

  const earmarks = useReadContracts({
    allowFailure: false,
    query: { enabled: Boolean(vault && categories) },
    contracts: (categories ?? []).map((_, i) => ({
      address: vault,
      abi: vaultAbi,
      functionName: 'earmarked' as const,
      args: [BigInt(i)],
    })),
  })

  return {
    org: org.data,
    vault,
    admin,
    meta: parseMetadata(metadataURI),
    categories: categories ?? [],
    earmarked: (earmarks.data ?? []) as bigint[],
    generalBalance,
    totalDonated,
    totalSpent,
    totalToBeneficiaries,
    isLoading: org.isLoading || reads.isLoading,
    error: org.error ?? reads.error,
    refetch: () => {
      reads.refetch()
      earmarks.refetch()
    },
  }
}
