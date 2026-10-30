import { Link } from 'react-router-dom'
import { useReadContract } from 'wagmi'
import { registryAbi } from '../abi'
import { REGISTRY } from '../config'

export default function Home() {
  const { data: orgs, isLoading, error } = useReadContract({
    address: REGISTRY,
    abi: registryAbi,
    functionName: 'getOrgs',
  })

  return (
    <>
      <section className="hero">
        <h1>See exactly where your giving goes.</h1>
        <p>
          Churches and NGOs receive G$ into a public vault. Every donation, recurring stream and
          spend is recorded on Celo, and money can only leave with a receipt attached. Aid
          payouts go only to GoodDollar-verified real people.
        </p>
        <Link to="/new" className="button">
          Register your organisation
        </Link>
      </section>

      <h2>Organisations</h2>
      {isLoading && <p className="muted">Loading…</p>}
      {error && <p className="error">Could not load the registry. Is VITE_REGISTRY_ADDRESS set?</p>}
      {orgs?.length === 0 && <p className="muted">No organisations yet.</p>}
      <div className="grid">
        {orgs?.map((o, i) => (
          <Link key={o.vault} to={`/org/${i}`} className="card org-card">
            <h3>
              {o.name} {o.reviewed && <span className="badge">Reviewed</span>}
            </h3>
            <p className="muted">
              Since {new Date(Number(o.createdAt) * 1000).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
