# SecureWithdraw - Authorization-Governed Vault System

A secure, production-grade smart contract system for controlled asset withdrawals with explicit authorization flows.

## Overview

This project implements a two-contract architecture that separates concerns between asset custody and permission validation:

- **SecureVault.sol**: Holds funds and executes withdrawals after authorization validation
- **AuthorizationManager.sol**: Validates withdrawal permissions and ensures each authorization is consumed exactly once

## Key Features

✅ Secure multi-contract architecture
✅ One-time authorization consumption (prevents reuse)
✅ Deterministic authorization message construction
✅ Strict state management (state updates before transfers)
✅ Comprehensive event emissions for observability
✅ No cryptographic verification in vault (separation of concerns)
✅ Gas optimized with proper error handling

## Installation & Setup

### Prerequisites
- Node.js v14+ and npm
- Docker (optional, for containerized deployment)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/Pujitha-png/SecureWithdraw.git
cd SecureWithdraw

# Install dependencies
npm install

# Compile smart contracts
npm run compile
```

## Project Structure

```
.
├── contracts/
│   ├── AuthorizationManager.sol    # Authorization validation logic
│   └── SecureVault.sol             # Vault fund management logic
├── scripts/
│   └── deploy.js                   # Deployment script
├── tests/
│   └── system.spec.js              # Test suite
├── docker/
│   ├── Dockerfile                  # Container configuration
│   └── entrypoint.sh               # Startup script
├── docker-compose.yml              # Docker compose configuration
├── hardhat.config.js               # Hardhat configuration
├── package.json                    # Project dependencies
└── README.md                       # This file
```

## Smart Contracts

### AuthorizationManager

Manages withdrawal authorizations for the SecureVault:

- `verifyAuthorization(...)`: Verifies and consumes an authorization
- `constructAuthMessage(...)`: Generates deterministic authorization hash
- `isAuthorizationConsumed(...)`: Checks if authorization has been used

**Key Properties:**
- Each authorization ID can only be consumed once
- Authorizations are bound to: vault address, chain ID, recipient, amount
- Events emitted for auditability

### SecureVault

Securely holds funds and processes withdrawals:

- `receive()`: Accepts native currency deposits
- `withdraw(...)`: Executes withdrawal after authorization validation
- `getVaultBalance()`: Returns current vault balance
- `getTotalDeposited()`: Returns accounting record of total deposits

**Key Properties:**
- State updates occur before fund transfers
- Authorizations are validated before execution
- All transactions are reversible on failure

## Usage Example

### 1. Running Hardhat Node

```bash
npm run node
```

### 2. Deploying Contracts

```bash
npm run deploy
```

### 3. Authorization Flow

```javascript
const { ethers } = require('hardhat');

// 1. Generate authorization hash
const vaultAddress = '0x...'; // deployed vault
const chainId = 31337;
const recipient = '0xRecipientAddress';
const amount = ethers.utils.parseEther('1.0');
const nonce = 1;

const authHash = ethers.utils.keccak256(
  ethers.utils.solidityPack(
    ['string', 'address', 'uint256', 'address', 'uint256', 'uint256'],
    ['WITHDRAWAL_AUTH', vaultAddress, chainId, recipient, amount, nonce]
  )
);

// 2. Submit withdrawal request with authorization
await vault.withdraw(recipient, amount, authHash);
```

## Testing

### Running Tests

```bash
npm test
```

### What Tests Verify

- Deposit acceptance and balance tracking
- Successful withdrawals with valid authorization
- Authorization consumption (one-time use)
- Failed withdrawals with invalid authorization
- State consistency across contract boundaries
- Event emissions for all transactions

## Docker Deployment

### Build and Run with Docker Compose

```bash
docker-compose up
```

This will:
1. Start a local EVM node (Hardhat)
2. Compile smart contracts
3. Deploy contracts to the node
4. Expose RPC endpoint at `http://localhost:8545`
5. Output deployed contract addresses

### Manual Docker Build

```bash
docker build -t securevault:latest .
docker run -p 8545:8545 securevault:latest
```

## Architecture Decisions

### Two-Contract Separation
- **Vault** handles fund management independently
- **AuthorizationManager** handles permission validation independently
- Clear separation reduces attack surface and improves auditability

### Authorization Design
- Deterministic hash construction prevents collisions
- Nonce or timestamp prevents replay attacks
- Tight binding to contextual parameters (vault, chain, recipient, amount)

### State Management
- All state updates occur **before** fund transfers (checks-effects-interactions pattern)
- Prevents reentrancy attacks and ensures consistency

## Security Considerations

✅ **No Reentrancy**: State updated before transfers
✅ **Authorization Reuse Prevention**: One-time consumption tracking
✅ **Parameter Validation**: All inputs validated before execution
✅ **Separation of Concerns**: Vault doesn't verify signatures
✅ **Event Emissions**: All critical operations logged
✅ **Deterministic Behavior**: No assumptions about call ordering

## Deployment Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Compile Contracts
```bash
npx hardhat compile
```

### Step 3: Run Local Node
```bash
npx hardhat node
```

### Step 4: Deploy (In Another Terminal)
```bash
npm run deploy
```

The deployment script outputs:
- AuthorizationManager contract address
- SecureVault contract address
- Network chain ID
- Deployment transaction hashes

## Verification

### Manual Testing

1. Connect to local node (via ethers.js, Web3.js, or MetaMask)
2. Send ether to vault address
3. Observe Deposited event
4. Create authorization hash
5. Call vault.withdraw() with authorization
6. Observe WithdrawalExecuted event

### Automated Testing

```bash
npm test
```

## Common Mistakes Avoided

❌ ~~Allowing same authorization to produce multiple effects~~ ✅ Fixed via consumption tracking
❌ ~~Transferring value before updating state~~ ✅ State updated first
❌ ~~Loose authorization scoping~~ ✅ Bound to vault, chain, recipient, amount
❌ ~~Coupling vault to auth logic~~ ✅ Clear separation via external call
❌ ~~Unprotected initialization~~ ✅ Constructor runs once
❌ ~~Assuming call ordering~~ ✅ Deterministic behavior regardless

## License

MIT

## Assumptions Made

1. Authorization generation occurs off-chain (front-end or server)
2. Clients possess the authorization hash before calling withdraw
3. The system operates on compatible EVM networks (Ethereum, Polygon, etc.)
4. Network chain ID is correctly set in Hardhat config

## Next Steps

1. Deploy to testnet (Sepolia, Mumbai, etc.)
2. Integrate with front-end application
3. Add signature verification layer (if needed)
4. Implement role-based authorization (admin, operator, etc.)
5. Add more sophisticated nonce/timestamp mechanisms

## Support

For issues or questions, please open an issue in the GitHub repository.
