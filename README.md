# Web3 Transaction Assembler

## Overview

**Web3 Transaction Assembler** is a server-side application that facilitates the creation of unsigned transactions for multiple blockchain networks, including:

- **Bitcoin** (via PSBT - Partially Signed Bitcoin Transactions)
- **Ethereum-compatible chains** (Ethereum, Polygon, Base)
- **Solana**  

The application exposes REST API endpoints to assemble transactions, making it easier to integrate blockchain transaction creation into your applications.

## Features

- 🟢 **Bitcoin**: Generates PSBT transactions  
- 🔵 **EVM Chains**: Creates unsigned Ethereum, Polygon, and Base transactions  
- 🟣 **Solana**: Assembles unsigned transactions for Solana  
- 🔒 **Security**: Implements `helmet` for security and `cors` for cross-origin requests  
- ⚡ **High Performance**: Lightweight and efficient transaction assembly  

---

### Prerequisites
- **Node.js** (>= 16.x)
- **npm** or **yarn**
- **Docker** (configured with the correct context)
- **Kubernetes** (local cluster, e.g., `k3d`)
- **Skaffold**
- **kubectx** (for managing Kubernetes contexts)
- **Make**
