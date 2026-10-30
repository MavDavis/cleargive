import { PINATA_JWT } from '../config'

export const canUpload = Boolean(PINATA_JWT)

/** Pin a receipt file to IPFS and return ipfs://CID */
export async function uploadReceipt(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body,
  })
  if (!res.ok) throw new Error(`Upload failed (${res.status})`)
  const { IpfsHash } = (await res.json()) as { IpfsHash: string }
  return `ipfs://${IpfsHash}`
}
