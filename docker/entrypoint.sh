#!/bin/sh

# Entrypoint script for SecureWithdraw Docker container

echo "========================================"
echo "  SecureWithdraw - Docker Startup"
echo "========================================"

echo "Step 1: Starting Hardhat node..."
npx hardhat node &
NODE_PID=$!

echo "Waiting for Hardhat node to be ready..."
sleep 5

echo ""
echo "Step 2: Compiling smart contracts..."
npx hardhat compile

echo ""
echo "Step 3: Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "RPC Endpoint: http://localhost:8545"
echo "Deployment info saved to: deployments.json"
echo ""
echo "Keep this container running. Press Ctrl+C to stop."
echo ""

wait $NODE_PID
