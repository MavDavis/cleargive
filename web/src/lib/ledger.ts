import type { Address, PublicClient } from 'viem'
import { cfaForwarderAbi, vaultAbi } from '../abi'
import { CFA_V1_FORWARDER, G_DOLLAR, SUPERFLUID_SUBGRAPH } from '../config'

const PAGE = 100n

export type LedgerEntry =
  | {
      kind: 'donation'
      timestamp: bigint
      donor: Address
      categoryId: bigint
      amount: bigint
      verifiedHuman: boolean
      memo: string
    }
  | {
      kind: 'spend'
      timestamp: bigint
      spendId: bigint
      by: Address
      to: Address
      categoryId: bigint
      amount: bigint
      beneficiaryCount: bigint
      receiptURI: string
      note: string
    }

export interface Stream {
  sender: Address
  flowRate: bigint
}

/** Reads the newest page of the vault's on-chain ledger. No indexer or log queries needed. */
export async function loadLedger(client: PublicClient, vault: Address) {
  const read = <T>(functionName: string, args: unknown[] = []) =>
    client.readContract({ address: vault, abi: vaultAbi, functionName, args } as never) as Promise<T>

  const [spendCount, donations, spends, uniqueVerifiedDonors, uniqueBeneficiaries, netFlowRate, streams] =
    await Promise.all([
      read<bigint>('spendCount'),
      read<readonly { donor: Address; timestamp: bigint; verifiedHuman: boolean; categoryId: bigint; amount: bigint; memo: string }[]>(
        'getDonations',
        [0n, PAGE],
      ),
      read<readonly { by: Address; to: Address; timestamp: bigint; categoryId: bigint; amount: bigint; beneficiaryCount: bigint; receiptURI: string; note: string }[]>(
        'getSpends',
        [0n, PAGE],
      ),
      read<bigint>('uniqueVerifiedDonors'),
      read<bigint>('uniqueBeneficiaries'),
      client.readContract({
        address: CFA_V1_FORWARDER,
        abi: cfaForwarderAbi,
        functionName: 'getAccountFlowrate',
        args: [G_DOLLAR, vault],
      }),
      loadStreams(vault).catch(() => [] as Stream[]), // the giver list is nice-to-have
    ])

  const entries: LedgerEntry[] = [
    ...donations.map((d) => ({ kind: 'donation' as const, ...d })),
    // getSpends is newest-first, so index i is spendId spendCount-1-i
    ...spends.map((s, i) => ({ kind: 'spend' as const, spendId: spendCount - 1n - BigInt(i), ...s })),
  ].sort((a, b) => Number(b.timestamp - a.timestamp))

  return {
    entries,
    streams,
    netFlowRate: netFlowRate > 0n ? netFlowRate : 0n,
    stats: {
      verifiedDonors: Number(uniqueVerifiedDonors),
      uniqueBeneficiaries: Number(uniqueBeneficiaries),
      spends: Number(spendCount),
    },
  }
}

/** Active G$ streams into the vault, from the Superfluid subgraph. */
async function loadStreams(vault: Address): Promise<Stream[]> {
  const query = `{ streams(first: 1000, where: { token: "${G_DOLLAR.toLowerCase()}", receiver: "${vault.toLowerCase()}", currentFlowRate_gt: "0" }) { sender { id } currentFlowRate } }`
  const res = await fetch(SUPERFLUID_SUBGRAPH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const json = (await res.json()) as {
    data: { streams: { sender: { id: Address }; currentFlowRate: string }[] }
  }
  return json.data.streams.map((s) => ({ sender: s.sender.id, flowRate: BigInt(s.currentFlowRate) }))
}

export async function loadPayouts(client: PublicClient, vault: Address, spendId: bigint) {
  return client.readContract({ address: vault, abi: vaultAbi, functionName: 'getPayouts', args: [spendId] })
}
