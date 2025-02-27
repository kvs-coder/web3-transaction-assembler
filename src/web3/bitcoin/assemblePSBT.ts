import axios from 'axios'
import { Psbt, address, networks } from 'bitcoinjs-lib'

class AssembleBitcoinError extends Error {
  constructor(error: unknown) {
    super(`Error assembling Bitcoin PSBT: ${error}`)
    this.name = 'AssembleBitcoinError'
  }
}

const BITCOIN_NETWORK = {
  // eslint-disable-next-line no-undef
  url: process.env.BITCOIN_BLOCKSTREAM_API,
  name: 'Bitcoin Mainnet',
}

const getUtxos = async (address: string) => {
  const response = await axios.get(
    `${BITCOIN_NETWORK.url}/address/${address}/utxo`,
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return response.data.map((utxo: any) => ({
    txid: utxo.txid,
    vout: utxo.vout,
    amount: utxo.value,
    scriptPubKey: utxo.script,
  }))
}

export const output = (psbt: Psbt): string => {
  return psbt.toBase64()
}

export const assemblePSBT = async ({
  fromAddress,
  toAddress,
  amount,
  feeRate,
}: {
  fromAddress: string
  toAddress: string
  amount: number
  feeRate: number
}): Promise<Psbt> => {
  const utxos = await getUtxos(fromAddress)
  if (utxos.length === 0) {
    throw new AssembleBitcoinError('No UTXOs available')
  }

  let psbt = new Psbt({ network: networks.bitcoin })

  let inputSum = 0
  for (const utxo of utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: address.toOutputScript(fromAddress, networks.bitcoin),
        value: utxo.amount,
      },
    })
    inputSum += utxo.amount
    if (inputSum >= amount + feeRate) break
  }

  if (inputSum < amount + feeRate) {
    throw new AssembleBitcoinError('Insufficient funds')
  }

  psbt.addOutput({
    address: toAddress,
    value: amount,
  })

  const change = inputSum - amount - feeRate
  if (change > 0) {
    psbt.addOutput({
      address: fromAddress,
      value: change,
    })
  }

  return psbt
}
