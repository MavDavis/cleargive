import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Address } from 'viem'
import { useAccount, usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import DonatePanel from '../components/DonatePanel'
import { EXPLORER, TESTNET } from '../config'
import { flowRateToMonthly, formatG, receiptHref, short } from '../lib/format'
import { loadLedger, loadPayouts } from '../lib/ledger'
import { useOrg } from '../lib/useOrg'

export default function OrgPage() {
  const id = BigInt(useParams().id!)
  const { address } = useAccount()
  const client = usePublicClient()
  const o = useOrg(id)

  const ledger = useQuery({
    queryKey: ['ledger', o.vault],
    enabled: Boolean(o.vault && client),
    queryFn: () => loadLedger(client!, o.vault!),
  })

  if (o.isLoading) return <p className="muted">Loading…</p>
  if (!o.org) return <p className="error">Organisation not found.</p>

  const monthlyIn = flowRateToMonthly(ledger.data?.netFlowRate ?? 0n)
  const isAdmin = address && o.admin?.toLowerCase() === address.toLowerCase()
  const refresh = () => {
    o.refetch()
    ledger.refetch()
  }

  return (
    <>
      <section className="org-header">
        <div>
          <h1>
            {o.org.name} {o.org.reviewed && <span className="badge">Reviewed</span>}
          </h1>
          {o.meta.description && <p>{o.meta.description}</p>}
          <p className="muted small">
            Vault{' '}
            <a href={`${EXPLORER}/address/${o.vault}`} target="_blank" rel="noreferrer">
              {short(o.vault!)}
            </a>
            {o.meta.website && (
              <>
                {' · '}
                <a href={o.meta.website} target="_blank" rel="noreferrer">
                  Website
                </a>
              </>
            )}
            {isAdmin && (
              <>
                {' · '}
                <Link to={`/org/${id}/manage`}>Manage</Link>
              </>
            )}
          </p>
        </div>
      </section>

      <div className="stats">
        <Stat
          label="Donated"
          value={formatG(o.totalDonated ?? 0n, 0)}
          sub={plural(ledger.data?.stats.verifiedDonors ?? 0, 'verified donor')}
        />
        {!TESTNET && <Stat label="Streaming in" value={`${formatG(monthlyIn, 0)}/mo`} sub={ledger.data?.streams.length ? `${ledger.data.streams.length} givers` : undefined} />}
        <Stat label="Spent with receipts" value={formatG(o.totalSpent ?? 0n, 0)} sub={plural(ledger.data?.stats.spends ?? 0, 'spend')} />
        <Stat
          label="Paid to verified people"
          value={formatG(o.totalToBeneficiaries ?? 0n, 0)}
          sub={plural(ledger.data?.stats.uniqueBeneficiaries ?? 0, 'unique human')}
        />
      </div>

      <div className="columns give-first">
        <div>
          <div className="card">
            <h2>Funds</h2>
            <table>
              <tbody>
                <tr>
                  <td>{TESTNET ? 'General' : 'General (incl. streams)'}</td>
                  <td className="num">{formatG(o.generalBalance ?? 0n)}</td>
                </tr>
                {o.categories.slice(1).map((c, i) => (
                  <tr key={c + i}>
                    <td>{c}</td>
                    <td className="num">{formatG(o.earmarked[i + 1] ?? 0n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Public ledger</h2>
            {ledger.isLoading && <p className="muted">Reading Celo…</p>}
            {ledger.error && <p className="error">{(ledger.error as Error).message}</p>}
            {ledger.data?.entries.length === 0 && <p className="muted">No activity yet.</p>}
            <ul className="ledger">
              {ledger.data?.entries.map((e, i) =>
                e.kind === 'donation' ? (
                  <li key={'d' + i} className="in">
                    <strong>+{formatG(e.amount)}</strong> from {short(e.donor)}
                    {e.verifiedHuman && <span className="badge">Verified</span>} →{' '}
                    {o.categories[Number(e.categoryId)]}
                    {e.memo && <em> “{e.memo}”</em>}
                    <When ts={e.timestamp} />
                  </li>
                ) : (
                  <li key={'s' + e.spendId} className="out">
                    <strong>−{formatG(e.amount)}</strong>{' '}
                    {e.beneficiaryCount > 0n ? (
                      <Payouts vault={o.vault!} spendId={e.spendId} count={e.beneficiaryCount} />
                    ) : (
                      <>to {short(e.to)}</>
                    )}{' '}
                    from {o.categories[Number(e.categoryId)]}
                    {e.note && <em> “{e.note}”</em>}{' '}
                    <a href={receiptHref(e.receiptURI)} target="_blank" rel="noreferrer">
                      Receipt
                    </a>
                    <When ts={e.timestamp} />
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <DonatePanel vault={o.vault!} categories={o.categories} onDonated={refresh} />
      </div>
    </>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
      {sub && <span className="muted small">{sub}</span>}
    </div>
  )
}

function When({ ts }: { ts: bigint }) {
  return <span className="tx">{new Date(Number(ts) * 1000).toLocaleDateString()}</span>
}

/** Beneficiary batches show a count; the list of verified recipients loads on demand. */
function Payouts({ vault, spendId, count }: { vault: Address; spendId: bigint; count: bigint }) {
  const client = usePublicClient()
  const [open, setOpen] = useState(false)
  const payouts = useQuery({
    queryKey: ['payouts', vault, spendId.toString()],
    enabled: open && Boolean(client),
    queryFn: () => loadPayouts(client!, vault, spendId),
  })
  return (
    <>
      to{' '}
      <button type="button" className="link" onClick={() => setOpen(!open)}>
        {count.toString()} verified people
      </button>
      {open && (
        <ul className="payouts">
          {payouts.isLoading && <li className="muted">Loading…</li>}
          {payouts.data?.map((p) => (
            <li key={p.beneficiary}>
              <a href={`${EXPLORER}/address/${p.beneficiary}`} target="_blank" rel="noreferrer">
                {short(p.beneficiary)}
              </a>{' '}
              {formatG(p.amount)}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
