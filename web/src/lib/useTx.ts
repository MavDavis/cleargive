import { useState } from 'react'
import { usePublicClient, useWriteContract } from 'wagmi'
import { BaseError } from 'viem'

/** Send a write, wait for it to be mined, expose a status string for the UI. */
export function useTx() {
  const client = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  const [status, setStatus] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function run(
    steps: { label: string; call: Parameters<typeof writeContractAsync>[0] }[],
    onDone?: () => void,
  ) {
    setBusy(true)
    try {
      for (const step of steps) {
        setStatus(`${step.label}: confirm in your wallet…`)
        const hash = await writeContractAsync(step.call)
        setStatus(`${step.label}: waiting for confirmation…`)
        const receipt = await client!.waitForTransactionReceipt({ hash })
        if (receipt.status !== 'success') throw new Error(`${step.label} reverted`)
      }
      setStatus('Done ✓')
      onDone?.()
    } catch (e) {
      setStatus(e instanceof BaseError ? e.shortMessage : (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return { run, status, busy }
}
