import { ethers } from 'ethers'

class AssembleEVMTransactionError extends Error {
  constructor(error: unknown) {
    super(`Error assembling EVM transaction: ${error}`)
    this.name = 'AssembleEVMTransactionError'
  }
}

type NetworkConfig = {
  chainId: number
  rpcUrl: string | undefined
  name: string
}

const EVM_NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    chainId: 1,
    // eslint-disable-next-line no-undef
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    name: 'Ethereum Mainnet',
  },
  polygon: {
    chainId: 137,
    // eslint-disable-next-line no-undef
    rpcUrl: process.env.POLYGON_RPC_URL,
    name: 'Polygon Mainnet',
  },
  base: {
    chainId: 8453,
    // eslint-disable-next-line no-undef
    rpcUrl: process.env.BASE_RPC_URL,
    name: 'Base Mainnet',
  },
} as const

export const output = (transaction: ethers.Transaction): string => {
  return transaction.unsignedSerialized
}

export const assembleEVMTransaction = async ({
  fromAddress,
  toAddress,
  network,
  amount,
  gasPrice,
  gasLimit,
}: {
  fromAddress: string
  toAddress: string
  network: string
  amount: number
  gasPrice: string | undefined
  gasLimit: string | undefined
}): Promise<ethers.Transaction> => {
  const chain = EVM_NETWORKS[network]

  if (!chain) {
    throw new AssembleEVMTransactionError('Unsupported EVM network')
  }

  if (!ethers.isAddress(fromAddress) || !ethers.isAddress(toAddress)) {
    throw new AssembleEVMTransactionError('Invalid Ethereum address')
  }

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl)
  const weiAmount = ethers.parseEther(amount.toString())
  const nonce = await provider.getTransactionCount(fromAddress, 'pending')

  const currentGasPrice = gasPrice
    ? ethers.parseUnits(gasPrice, 'gwei')
    : await provider
        .getFeeData()
        .then((fee) => fee.gasPrice || ethers.parseUnits('20', 'gwei'))

  const estimatedGasLimit = gasLimit
    ? BigInt(gasLimit)
    : await provider.estimateGas({
        from: fromAddress,
        to: toAddress,
        value: weiAmount,
      })

  const transaction = {
    nonce,
    to: toAddress,
    value: weiAmount,
    gasLimit: estimatedGasLimit,
    gasPrice: currentGasPrice,
    chainId: chain.chainId,
  }

  const gasCost = BigInt(estimatedGasLimit) * BigInt(currentGasPrice)
  const totalCost = weiAmount + gasCost
  const balance = await provider.getBalance(fromAddress)

  if (balance < totalCost) {
    throw new AssembleEVMTransactionError('Insufficient funds')
  }

  return ethers.Transaction.from(transaction) // hex
}
