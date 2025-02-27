import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { Buffer } from 'buffer'
import bs58 from 'bs58'

class AssembleSolanaTransactionError extends Error {
  constructor(error: unknown) {
    super(`Error assembling Solana transaction: ${error}`)
    this.name = 'AssembleSolanaTransactionError'
  }
}

const SOLANA_NETWORK = {
  // eslint-disable-next-line no-undef
  rpcUrl: process.env.SOLANA_RPC_URL,
  name: 'Solana Mainnet',
}

export const output = (buffer: Buffer<ArrayBufferLike>): string => {
  return bs58.encode(buffer)
}

export const assembleSolanaTransaction = async ({
  fromAddress,
  toAddress,
  amount,
}: {
  fromAddress: string
  toAddress: string
  amount: number
}): Promise<Buffer<ArrayBufferLike>> => {
  if (!SOLANA_NETWORK.rpcUrl) {
    throw new AssembleSolanaTransactionError('RPC url was null')
  }

  let fromPubkey: PublicKey
  let toPubkey: PublicKey

  try {
    fromPubkey = new PublicKey(fromAddress)
    toPubkey = new PublicKey(toAddress)
  } catch (error) {
    throw new AssembleSolanaTransactionError(
      `Invalid Solana address, cause: ${error}`,
    )
  }

  const connection = new Connection(SOLANA_NETWORK.rpcUrl, 'confirmed')
  const lamports = Math.floor(parseFloat(amount.toString()) * LAMPORTS_PER_SOL)

  const balance = await connection.getBalance(fromPubkey)
  if (balance < lamports) {
    throw new AssembleSolanaTransactionError('Insufficient funds')
  }

  const { blockhash } = await connection.getLatestBlockhash()

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: fromPubkey,
  }).add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    }),
  )

  return transaction.serialize({
    requireAllSignatures: false,
  })
}
