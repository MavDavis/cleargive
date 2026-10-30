import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAccount, useReadContract } from 'wagmi'
import { isAddress, type Address } from 'viem'
import { vaultAbi } from '../abi'
import { formatG, toWei } from '../lib/format'
import { canUpload, uploadReceipt } from '../lib/pinata'
import { useOrg } from '../lib/useOrg'
import { useTx } from '../lib/useTx'

export default function Manage() {
  const id = BigInt(useParams().id!)
  const { address } = useAccount()
  const o = useOrg(id)
  const manager = useReadContract({
    address: o.vault,
    abi: vaultAbi,
    functionName: 'isManager',
    args: [address!],
    query: { enabled: Boolean(o.vault && address) },
  })

  if (o.isLoading) return <p className="muted">Loading…</p>
  if (!o.org) return <p className="error">Organisation not found.</p>

  const isAdmin = Boolean(address && o.admin?.toLowerCase() === address.toLowerCase())
  const canSpend = isAdmin || Boolean(manager.data)

  return (
    <>
      <h1>Manage {o.org.name}</h1>
      <p>
        <Link to={`/org/${id}`}>← Public page</Link> · Available in General:{' '}
        {formatG(o.generalBalance ?? 0n)}
      </p>
      {!canSpend && <p className="error">Connect the admin or a treasurer wallet to manage this vault.</p>}

      <div className="columns">
        <div>
          {canSpend && <SpendForm vault={o.vault!} categories={o.categories} onDone={o.refetch} />}
          {canSpend && <BeneficiaryForm vault={o.vault!} categories={o.categories} onDone={o.refetch} />}
        </div>
        <div>{isAdmin && <AdminForms vault={o.vault!} onDone={o.refetch} />}</div>
      </div>
    </>
  )
}

function ReceiptInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string>()
  return (
    <label>
      Receipt (required) — invoice, photo or payment list
      {canUpload && (
        <input
          type="file"
          accept="image/*,application/pdf,text/csv"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setUploading(true)
            setErr(undefined)
            try {
              onChange(await uploadReceipt(file))
            } catch (x) {
              setErr((x as Error).message)
            } finally {
              setUploading(false)
            }
          }}
        />
      )}
      <input
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={canUpload ? 'ipfs://… (filled after upload)' : 'ipfs://CID or https:// link'}
      />
      {uploading && <span className="muted small">Uploading to IPFS…</span>}
      {err && <span className="error small">{err}</span>}
    </label>
  )
}

function CategorySelect({ categories, value, onChange }: { categories: string[]; value: number; onChange: (v: number) => void }) {
  return (
    <label>
      Budget category
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {categories.map((c, i) => (
          <option key={i} value={i}>
            {c}
          </option>
        ))}
      </select>
    </label>
  )
}

interface FormProps {
  vault: Address
  categories: string[]
  onDone: () => void
}

function SpendForm({ vault, categories, onDone }: FormProps) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  const [receipt, setReceipt] = useState('')
  const [note, setNote] = useState('')
  const { run, status, busy } = useTx()

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault()
        run(
          [
            {
              label: 'Record spend',
              call: {
                address: vault,
                abi: vaultAbi,
                functionName: 'spend',
                args: [to as Address, toWei(amount), BigInt(categoryId), receipt, note],
              },
            },
          ],
          onDone,
        )
      }}
    >
      <h2>Pay an expense</h2>
      <label>
        Pay to (supplier / vendor address)
        <input required value={to} onChange={(e) => setTo(e.target.value)} />
      </label>
      <label>
        Amount (G$)
        <input required type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
      <ReceiptInput value={receipt} onChange={setReceipt} />
      <label>
        Public note
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 40 chairs for the hall" />
      </label>
      <button disabled={busy || !isAddress(to) || !receipt}>Pay & publish</button>
      {status && <p className="status">{status}</p>}
    </form>
  )
}

function BeneficiaryForm({ vault, categories, onDone }: FormProps) {
  const [csv, setCsv] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  const [receipt, setReceipt] = useState('')
  const [note, setNote] = useState('')
  const { run, status, busy } = useTx()

  const rows = csv
    .split('\n')
    .map((l) => l.split(',').map((s) => s.trim()))
    .filter(([a, amt]) => a && amt)
  const invalid = rows.filter(([a, amt]) => !isAddress(a) || !(Number(amt) > 0))

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault()
        run(
          [
            {
              label: 'Pay beneficiaries',
              call: {
                address: vault,
                abi: vaultAbi,
                functionName: 'payBeneficiaries',
                args: [rows.map(([a]) => a as Address), rows.map(([, amt]) => toWei(amt)), BigInt(categoryId), receipt, note],
              },
            },
          ],
          onDone,
        )
      }}
    >
      <h2>Pay beneficiaries</h2>
      <p className="muted small">
        Every recipient must be verified with GoodDollar. The transaction fails if anyone on the list
        isn't, so ghost beneficiaries can't be paid.
      </p>
      <label>
        One per line: address, amount
        <textarea rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="0xabc…, 500" />
      </label>
      {invalid.length > 0 && <p className="error small">{invalid.length} line(s) look wrong.</p>}
      <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
      <ReceiptInput value={receipt} onChange={setReceipt} />
      <label>
        Public note
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Term 1 school fee support" />
      </label>
      <button disabled={busy || rows.length === 0 || invalid.length > 0 || !receipt}>
        Pay {rows.length} people
      </button>
      {status && <p className="status">{status}</p>}
    </form>
  )
}

function AdminForms({ vault, onDone }: { vault: Address; onDone: () => void }) {
  const [category, setCategory] = useState('')
  const [manager, setManager] = useState('')
  const cat = useTx()
  const mgr = useTx()

  return (
    <>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault()
          cat.run(
            [{ label: 'Add category', call: { address: vault, abi: vaultAbi, functionName: 'addCategory', args: [category] } }],
            () => {
              setCategory('')
              onDone()
            },
          )
        }}
      >
        <h2>Budget categories</h2>
        <p className="muted small">Donors can earmark gifts to a category. That money can only be spent on it.</p>
        <input required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Building fund" />
        <button disabled={cat.busy}>Add category</button>
        {cat.status && <p className="status">{cat.status}</p>}
      </form>

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault()
          mgr.run(
            [{ label: 'Add treasurer', call: { address: vault, abi: vaultAbi, functionName: 'setManager', args: [manager as Address, true] } }],
            onDone,
          )
        }}
      >
        <h2>Treasurers</h2>
        <p className="muted small">Treasurers can pay expenses and beneficiaries, always with a receipt.</p>
        <input required value={manager} onChange={(e) => setManager(e.target.value)} placeholder="0x…" />
        <button disabled={mgr.busy || !isAddress(manager)}>Add treasurer</button>
        {mgr.status && <p className="status">{mgr.status}</p>}
      </form>
    </>
  )
}
