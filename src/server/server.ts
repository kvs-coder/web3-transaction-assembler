/* eslint-disable no-undef */
import express, { Request, Response, Express } from 'express'
import bodyParser from 'body-parser'
import {
  assemblePSBT,
  output as psbtOutput,
} from '../web3/bitcoin/assemblePSBT'
import {
  assembleEVMTransaction,
  output as evmTransactionOutput,
} from '../web3/evm/assembleEVMTransaction'
import helmet from 'helmet'
import cors from 'cors'
import dotenv from 'dotenv'
import {
  assembleSolanaTransaction,
  output as solanaTransactionOutput,
} from '../web3/solana/assembleSolanaTransaction'

dotenv.config()

const app = express()
app.use(bodyParser.json())

interface Input {
  fromAddress: string
  toAddress: string
  amount: number
}

interface BitcoinInput extends Input {
  feeRate: number
}

type SolanaInput = Input

interface EVMInput extends Input {
  network: 'ethereum' | 'polygon' | 'base'
  gasPrice?: string // Optional, in gwei
  gasLimit?: string // Optional
}

class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'APIError'
  }
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  uptime: number
  timestamp: string
  environment?: string
}

const validateBitcoinInput = (input: unknown): input is BitcoinInput => {
  const data = input as BitcoinInput
  return !!(data.fromAddress && data.toAddress && data.amount && data.feeRate)
}

const validateEVMInput = (input: unknown): input is EVMInput => {
  const data = input as EVMInput
  return !!(data.fromAddress && data.toAddress && data.amount && data.network)
}

const validateSolanaInput = (input: unknown): input is SolanaInput => {
  const data = input as SolanaInput
  return !!(data.fromAddress && data.toAddress && data.amount)
}

const createServer = (): Express => {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(bodyParser.json())
  app.use(express.json())

  app.get('/health', (req: Request, res: Response): void => {
    try {
      const healthStatus: HealthStatus = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      }
      res.status(200).json(healthStatus)
    } catch (error) {
      console.error('Health check failed:', error)
      const errorStatus: HealthStatus = {
        status: 'unhealthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }
      res.status(500).json(errorStatus)
    }
  })

  app.post(
    '/create/transaction/bitcoin',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const input = req.body
        if (!validateBitcoinInput(input)) {
          throw new APIError(400, 'Missing required parameters')
        }

        const { fromAddress, toAddress, amount, feeRate } = input

        let psbt = await assemblePSBT({
          fromAddress,
          toAddress,
          amount,
          feeRate,
        })

        res.json({ psbt: psbtOutput(psbt) })
      } catch (error) {
        const err =
          error instanceof APIError
            ? error
            : new APIError(500, 'Internal server error')
        console.error('Error creating PSBT:', error)
        res.status(err.statusCode).json({ error: err.message })
      }
    },
  )

  app.post(
    '/create/transaction/evm',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const input = req.body as EVMInput
        if (!validateEVMInput(input)) {
          throw new APIError(400, 'Missing required parameters')
        }

        const { fromAddress, toAddress, amount, network, gasPrice, gasLimit } =
          input

        const evmTransaction = await assembleEVMTransaction({
          fromAddress,
          toAddress,
          network,
          amount,
          gasPrice,
          gasLimit,
        })

        res.json({ unsignedTx: evmTransactionOutput(evmTransaction) })
      } catch (error) {
        const err =
          error instanceof APIError
            ? error
            : new APIError(500, 'Internal server error')
        console.error('Error creating EVM transaction:', error)
        res.status(err.statusCode).json({ error: err.message })
      }
    },
  )

  app.post(
    '/create/transaction/solana',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const input = req.body
        if (!validateSolanaInput(input)) {
          throw new APIError(400, 'Missing required parameters')
        }

        const { fromAddress, toAddress, amount } = input

        const solanaTransaction = await assembleSolanaTransaction({
          fromAddress,
          toAddress,
          amount,
        })

        res.json({
          unsignedTx: solanaTransactionOutput(solanaTransaction),
        })
      } catch (error) {
        const err =
          error instanceof APIError
            ? error
            : new APIError(500, 'Internal server error')
        console.error('Error creating Solana transaction:', error)
        res.status(err.statusCode).json({ error: err.message })
      }
    },
  )

  return app
}

const startServer = (port: number): void => {
  const app = createServer()

  app
    .listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
    .on('error', (error) => {
      console.error('Server failed to start:', error)
      process.exit(1)
    })
}

export { startServer }

/*
curl -X POST http://localhost:30090/create/transaction/bitcoin \
     -H "Content-Type: application/json" \
     -d '{
          "fromAddress": "bc1qcpk60sc7yjayu7sx2ezru97qq4e2860h6wpchk",
          "toAddress": "bc1qcpk60sc7yjayu7sx2ezru97qq4e2860h6wpchk",
          "amount": 10000,
          "feeRate": 1000
        }'
*/
