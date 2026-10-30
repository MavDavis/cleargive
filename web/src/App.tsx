import { Link, Route, Routes } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { celo } from 'wagmi/chains'
import { short } from './lib/format'
import Home from './pages/Home'
import CreateOrg from './pages/CreateOrg'
import OrgPage from './pages/OrgPage'
import Manage from './pages/Manage'

function WalletButton() {
  const { address, chainId, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  if (!isConnected) {
    return (
      <button onClick={() => connect({ connector: connectors[0] })}>Connect wallet</button>
    )
  }
  if (chainId !== celo.id) {
    return <button onClick={() => switchChain({ chainId: celo.id })}>Switch to Celo</button>
  }
  return (
    <button className="secondary" onClick={() => disconnect()} title="Disconnect">
      {short(address!)}
    </button>
  )
}

export default function App() {
  return (
    <>
      <header>
        <Link to="/" className="brand">
          <img src="/logo.svg" alt="" width={32} height={32} />
          ClearGive
        </Link>
        <nav>
          <Link to="/">Organisations</Link>
          <Link to="/new">Register</Link>
          <WalletButton />
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<CreateOrg />} />
          <Route path="/org/:id" element={<OrgPage />} />
          <Route path="/org/:id/manage" element={<Manage />} />
        </Routes>
      </main>
      <footer>
        Every donation and every spend is on Celo. Funds can only leave with a receipt.
      </footer>
    </>
  )
}
