const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SecureVault and AuthorizationManager System', () => {
  let authManager, vault, owner, addr1, addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy AuthorizationManager
    const AuthorizationManager = await ethers.getContractFactory('AuthorizationManager');
    authManager = await AuthorizationManager.deploy();
    await authManager.deployed();

    // Deploy SecureVault
    const SecureVault = await ethers.getContractFactory('SecureVault');
    vault = await SecureVault.deploy(authManager.address);
    await vault.deployed();
  });

  describe('Deposits', () => {
    it('Should accept deposits and update balance', async () => {
      const depositAmount = ethers.utils.parseEther('1.0');
      await expect(() => owner.sendTransaction({
        to: vault.address,
        value: depositAmount,
      })).to.changeEtherBalance(vault, depositAmount);

      const balance = await vault.getTotalDeposited();
      expect(balance).to.equal(depositAmount);
    });

    it('Should emit Deposited event', async () => {
      const depositAmount = ethers.utils.parseEther('1.0');
      await expect(owner.sendTransaction({
        to: vault.address,
        value: depositAmount,
      })).to.emit(vault, 'Deposited');
    });
  });

  describe('Authorization Management', () => {
    it('Should verify valid authorization', async () => {
      const authId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-auth-1'));
      const result = await authManager.verifyAuthorization(
        vault.address,
        31337,
        addr1.address,
        ethers.utils.parseEther('0.5'),
        authId
      );
      expect(result).to.be.true;
    });

    it('Should mark authorization as consumed after use', async () => {
      const authId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-auth-2'));
      await authManager.verifyAuthorization(
        vault.address,
        31337,
        addr1.address,
        ethers.utils.parseEther('0.5'),
        authId
      );

      const isConsumed = await authManager.isAuthorizationConsumed(authId);
      expect(isConsumed).to.be.true;
    });

    it('Should prevent reuse of consumed authorization', async () => {
      const authId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-auth-3'));
      await authManager.verifyAuthorization(
        vault.address,
        31337,
        addr1.address,
        ethers.utils.parseEther('0.5'),
        authId
      );

      await expect(
        authManager.verifyAuthorization(
          vault.address,
          31337,
          addr1.address,
          ethers.utils.parseEther('0.5'),
          authId
        )
      ).to.be.revertedWith('Authorization already consumed');
    });
  });

  describe('Withdrawals', () => {
    beforeEach(async () => {
      const depositAmount = ethers.utils.parseEther('2.0');
      await owner.sendTransaction({
        to: vault.address,
        value: depositAmount,
      });
    });

    it('Should allow withdrawal with valid authorization', async () => {
      const withdrawAmount = ethers.utils.parseEther('1.0');
      const authId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('withdrawal-1'));

      await expect(
        vault.withdraw(addr1.address, withdrawAmount, authId)
      ).to.changeEtherBalance(addr1, withdrawAmount);
    });

    it('Should reject withdrawal with invalid authorization', async () => {
      const withdrawAmount = ethers.utils.parseEther('1.0');
      const invalidAuthId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('invalid-1'));

      // First use the authorization
      await authManager.verifyAuthorization(
        vault.address,
        31337,
        addr1.address,
        withdrawAmount,
        invalidAuthId
      );

      // Try to use it again (should fail)
      await expect(
        vault.withdraw(addr1.address, withdrawAmount, invalidAuthId)
      ).to.be.revertedWith('Authorization already consumed');
    });

    it('Should update accounting after withdrawal', async () => {
      const initialBalance = await vault.getTotalDeposited();
      const withdrawAmount = ethers.utils.parseEther('0.5');
      const authId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('withdrawal-2'));

      await vault.withdraw(addr1.address, withdrawAmount, authId);

      const finalBalance = await vault.getTotalDeposited();
      expect(finalBalance).to.equal(initialBalance.sub(withdrawAmount));
    });

    it('Should emit WithdrawalExecuted event', async () => {
      const withdrawAmount = ethers.utils.parseEther('1.0');
      const authId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('withdrawal-3'));

      await expect(
        vault.withdraw(addr1.address, withdrawAmount, authId)
      ).to.emit(vault, 'WithdrawalExecuted');
    });
  });

  describe('System Invariants', () => {
    it('Should never allow vault balance to go negative', async () => {
      const depositAmount = ethers.utils.parseEther('1.0');
      await owner.sendTransaction({
        to: vault.address,
        value: depositAmount,
      });

      const excessAmount = ethers.utils.parseEther('2.0');
      const authId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('excess-withdrawal'));

      await expect(
        vault.withdraw(addr1.address, excessAmount, authId)
      ).to.be.revertedWith('Insufficient vault balance');
    });

    it('Should handle multiple deposits and withdrawals correctly', async () => {
      const deposit1 = ethers.utils.parseEther('1.0');
      const deposit2 = ethers.utils.parseEther('2.0');
      const withdraw1 = ethers.utils.parseEther('0.5');
      const withdraw2 = ethers.utils.parseEther('1.5');

      // Deposits
      await owner.sendTransaction({ to: vault.address, value: deposit1 });
      await addr2.sendTransaction({ to: vault.address, value: deposit2 });

      let balance = await vault.getTotalDeposited();
      expect(balance).to.equal(deposit1.add(deposit2));

      // Withdrawals
      const authId1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('multi-1'));
      const authId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('multi-2'));

      await vault.withdraw(addr1.address, withdraw1, authId1);
      await vault.withdraw(addr1.address, withdraw2, authId2);

      balance = await vault.getTotalDeposited();
      expect(balance).to.equal(deposit1.add(deposit2).sub(withdraw1).sub(withdraw2));
    });
  });
});
