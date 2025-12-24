const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Starting deployment...');

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from account: ${deployer.address}`);

  // Deploy AuthorizationManager
  console.log('\nDeploying AuthorizationManager...');
  const AuthorizationManager = await ethers.getContractFactory('AuthorizationManager');
  const authManager = await AuthorizationManager.deploy();
  await authManager.deployed();
  console.log(`AuthorizationManager deployed at: ${authManager.address}`);

  // Deploy SecureVault
  console.log('\nDeploying SecureVault...');
  const SecureVault = await ethers.getContractFactory('SecureVault');
  const vault = await SecureVault.deploy(authManager.address);
  await vault.deployed();
  console.log(`SecureVault deployed at: ${vault.address}`);

  // Log deployment info
  const deploymentInfo = {
    authManager: authManager.address,
    vault: vault.address,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  console.log('\n=== DEPLOYMENT SUMMARY ===');
  console.log(`AuthorizationManager: ${authManager.address}`);
  console.log(`SecureVault: ${vault.address}`);
  console.log(`Chain ID: ${deploymentInfo.chainId}`);
  console.log(`Deployer: ${deployer.address}`);

  // Save deployment info
  const deployPath = path.join(__dirname, '../deployments.json');
  fs.writeFileSync(deployPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deployPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
