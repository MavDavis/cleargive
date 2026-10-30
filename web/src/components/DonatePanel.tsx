import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import type { Address } from 'viem'
import { cfaForwarderAbi, erc20Abi, vaultAbi } from '../abi'
import { CFA_V1_FORWARDER, G_DOLLAR, GOODDOLLAR_VERIFY_URL } from '../config'
import { flowRateToMonthly, formatG, monthlyToFlowRate, toWei } from '../lib/format'
import { useTx } from '../lib/useTx'

interface Props {
  vault: Address
  categories: string[]
  onDonated: () => void
}

export default function DonatePanel({ vault, categories, onDonated }: Props) {
  const { address } = useAccount()
  const [mode, setMode] = useState<'once' | 'monthly'>('once')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  const [memo, setMemo] = useState('')
  const { run, status, busy } = useTx()

  const balance = useReadContract({
    address: G_DOLLAR,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: Boolean(address) },
  })
  const verified = useReadContract({
    address: vault,
    abi: vaultAbi,
    functionName: 'isVerifiedHuman',
    args: [address!],
    query: { enabled: Boolean(address) },
  })
  const myStream = useReadContract({
    address: CFA_V1_FORWARDER,
    abi: cfaForwarderAbi,
    functionName: 'getFlowrate',
    args: [G_DOLLAR, address!, vault],
    query: { enabled: Boolean(address) },
  })

  const refresh = () => {
    balance.refetch()
    myStream.refetch()
    onDonated()
  }

  function donateOnce() {
    const wei = toWei(amount)
    run(
      [
        {
          label: 'Approve G$',
          call: { address: G_DOLLAR, abi: erc20Abi, functionName: 'approve', args: [vault, wei] },
        },
        {
          label: 'Donate',
          call: {
            address: vault,
            abi: vaultAbi,
            functionName: 'donate',
            args: [wei, BigInt(categoryId), memo],
          },
        },
      ],
      refresh,
    )
  }

  function setStream(monthlyG: string) {
    run(
      [
        {
          label: monthlyG === '0' ? 'Stop stream' : 'Start stream',
          call: {
            address: CFA_V1_FORWARDER,
            abi: cfaForwarderAbi,
            functionName: 'setFlowrate',
            args: [G_DOLLAR, vault, monthlyToFlowRate(monthlyG)],
          },
        },
      ],
      refresh,
    )
  }

  if (!address) return <div className="card">Connect your wallet to give.</div>

  const currentRate = myStream.data ?? 0n

  return (
    <div className="card">
      <h2>Give</h2>
      <p className="muted">
        Balance: {balance.data !== undefined ? formatG(balance.data) : '…'}
        {verified.data ? (
          <span className="badge">Verified human</span>
        ) : (
          <>
            {' · '}
            <a href={GOODDOLLAR_VERIFY_URL} target="_blank" rel="noreferrer">
              Verify with GoodDollar
            </a>{' '}
            to show as a verified donor
          </>
        )}
      </p>

      <div className="tabs">
        <button className={mode === 'once' ? '' : 'secondary'} onClick={() => setMode('once')}>
          One-time
        </button>
        <button className={mode === 'monthly' ? '' : 'secondary'} onClick={() => setMode('monthly')}>
          Monthly stream
        </button>
      </div>

      <label>
        Amount (G${mode === 'monthly' ? ' per month' : ''})
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>

      {mode === 'once' ? (
        <>
          <label>
            Give to
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
              {categories.map((c, i) => (
                <option key={i} value={i}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Note (public, optional)
            <input value={memo} onChange={(e) => setMemo(e.target.value)} />
          </label>
          <button disabled={busy || !amount} onClick={donateOnce}>
            Donate
          </button>
        </>
      ) : (
        <>
          <p className="muted small">
            Streams go to the General fund, move every second, and you can stop them any time.
            {currentRate > 0n && <> You currently give {formatG(flowRateToMonthly(currentRate))}/month.</>}
          </p>
          <button disabled={busy || !amount} onClick={() => setStream(amount)}>
            {currentRate > 0n ? 'Update stream' : 'Start stream'}
          </button>
          {currentRate > 0n && (
            <button className="secondary" disabled={busy} onClick={() => setStream('0')}>
              Stop my stream
            </button>
          )}
        </>
      )}
      {status && <p className="status">{status}</p>}
    </div>
  )
}
