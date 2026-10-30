import { formatUnits, parseUnits, type Address } from 'viem'

export const SECONDS_PER_MONTH = 30n * 24n * 3600n

export const toWei = (g: string) => parseUnits(g || '0', 18)

export function formatG(wei: bigint, digits = 2): string {
  const n = Number(formatUnits(wei, 18))
  return `G$ ${n.toLocaleString(undefined, { maximumFractionDigits: digits })}`
}

export const monthlyToFlowRate = (monthlyG: string) => toWei(monthlyG) / SECONDS_PER_MONTH
export const flowRateToMonthly = (flowRate: bigint) => flowRate * SECONDS_PER_MONTH

export const short = (a: Address | string) => `${a.slice(0, 6)}…${a.slice(-4)}`

/** ipfs://CID, a bare CID or an https URL → something a browser can open */
export function receiptHref(uri: string): string {
  if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.slice(7)}`
  if (/^(Qm|baf)[a-zA-Z0-9]+$/.test(uri)) return `https://ipfs.io/ipfs/${uri}`
  return uri
}
