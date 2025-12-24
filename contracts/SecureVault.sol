// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AuthorizationManager.sol";

/**
 * @title SecureVault
 * @dev Holds funds and facilitates withdrawals based on authorization from AuthorizationManager.
 */
contract SecureVault {
    // Events
    event Deposited(address indexed depositor, uint256 amount, uint256 balance);
    event WithdrawalRequested(address indexed requester, bytes32 indexed authId, address recipient, uint256 amount);
    event WithdrawalExecuted(address indexed recipient, uint256 amount, bytes32 indexed authId);
    event WithdrawalFailed(bytes32 indexed authId, string reason);

    // Storage
    AuthorizationManager public authManager;
    uint256 public totalDeposited;
    mapping(address => uint256) public balances;

    constructor(address authManagerAddress) {
        require(authManagerAddress != address(0), "Invalid AuthorizationManager");
        authManager = AuthorizationManager(authManagerAddress);
        totalDeposited = 0;
    }

    /**
     * @dev Allows anyone to deposit native blockchain currency.
     */
    receive() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        totalDeposited += msg.value;
        emit Deposited(msg.sender, msg.value, address(this).balance);
    }

    /**
     * @dev Executes a withdrawal after authorization validation.
     * @param recipient The address receiving the funds
     * @param amount The withdrawal amount
     * @param authId The unique authorization identifier
     */
    function withdraw(
        address recipient,
        uint256 amount,
        bytes32 authId
    ) external {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(address(this).balance >= amount, "Insufficient vault balance");

        // Verify authorization with AuthorizationManager
        bool authorized = authManager.verifyAuthorization(
            address(this),
            block.chainid,
            recipient,
            amount,
            authId
        );
        require(authorized, "Authorization verification failed");

        // Update state before transfer
        totalDeposited -= amount;

        // Execute transfer
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "Transfer failed");

        emit WithdrawalExecuted(recipient, amount, authId);
    }

    /**
     * @dev Returns the current vault balance.
     */
    function getVaultBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Returns the total amount deposited (accounting record).
     */
    function getTotalDeposited() external view returns (uint256) {
        return totalDeposited;
    }
}
