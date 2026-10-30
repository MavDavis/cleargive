import { useAccount, useReadContract } from 'wagmi'
import { G_DOLLAR, GOOD_ID } from '../config'
import { useTx } from '../lib/useTx'

const faucetAbi = [{ type: 'function', name: 'faucet', stateMutability: 'nonpayable', inputs: [], outputs: [] }] as const
const testIdentityAbi = [
  { type: 'function', name: 'verifyMe', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  {
    type: 'function',
    name: 'isVerified',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
] as const

const CELO_FAUCET = 'https://faucet.celo.org/celo-sepolia'

/** Explains the test-network demo and hands out test G$ and test verification. */
export default function TestnetBanner() {
  const { address } = useAccount()
  const { run, status, busy } = useTx()
  const verified = useReadContract({
    address: GOOD_ID,
    abi: testIdentityAbi,
    functionName: 'isVerified',
    args: [address!],
    query: { enabled: Boolean(address) },
  })

  return (
    <div className="testnet-banner">
      <p>
        <strong>Demo on the Celo test network.</strong> Test G$ has no value. To try it, get free test CELO
        for fees from the{' '}
        <a href={CELO_FAUCET} target="_blank" rel="noreferrer">
          Celo faucet
        </a>
        , then:
      </p>
      {address ? (
        <div className="actions">
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              run([{ label: 'Get test G$', call: { address: G_DOLLAR, abi: faucetAbi, functionName: 'faucet' } }])
            }
          >
            Get 10,000 test G$
          </button>
          {verified.data ? (
            <span className="badge">Verified human (test)</span>
          ) : (
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                run(
                  [{ label: 'Verify', call: { address: GOOD_ID, abi: testIdentityAbi, functionName: 'verifyMe' } }],
                  () => verified.refetch(),
                )
              }
            >
              Verify me (test)
            </button>
          )}
          {status && <span className="status">{status}</span>}
        </div>
      ) : (
        <p className="muted">Connect your wallet to get test G$.</p>
      )}
    </div>
  )
}
