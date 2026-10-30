import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { BaseError, parseEventLogs } from 'viem'
import { registryAbi } from '../abi'
import { REGISTRY } from '../config'
import { encodeMetadata } from '../lib/useOrg'

export default function CreateOrg() {
  const { address } = useAccount()
  const client = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [admin, setAdmin] = useState('')
  const [status, setStatus] = useState<string>()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setStatus('Confirm in your wallet…')
      const hash = await writeContractAsync({
        address: REGISTRY,
        abi: registryAbi,
        functionName: 'createOrg',
        args: [name, encodeMetadata({ description, website }), (admin || address) as `0x${string}`],
      })
      setStatus('Creating your vault…')
      const receipt = await client!.waitForTransactionReceipt({ hash })
      const [created] = parseEventLogs({ abi: registryAbi, eventName: 'OrgCreated', logs: receipt.logs })
      navigate(`/org/${created.args.orgId}/manage`)
    } catch (err) {
      setStatus(err instanceof BaseError ? err.shortMessage : (err as Error).message)
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>Register an organisation</h1>
      <p className="muted">
        This creates a public G$ vault for your church or NGO. You can add budget categories and
        treasurers after.
      </p>
      <label>
        Name
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Grace Chapel Lagos" />
      </label>
      <label>
        What do you do?
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </label>
      <label>
        Website
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
      </label>
      <label>
        Admin address <span className="muted">(defaults to you; a Safe multisig is recommended)</span>
        <input value={admin} onChange={(e) => setAdmin(e.target.value)} placeholder={address} />
      </label>
      <button disabled={!address}>{address ? 'Create vault' : 'Connect your wallet first'}</button>
      {status && <p className="status">{status}</p>}
    </form>
  )
}
