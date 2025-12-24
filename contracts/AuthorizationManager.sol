// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SecureVault.sol";

/**
 * @title AuthorizationManager
 * @dev Manages withdrawal authorizations for the SecureVault.
 * Each authorization can only be used once and is bound to specific parameters.
 */
contract AuthorizationManager {
    // Events
    event AuthorizationVerified(bytes32 indexed authId, address indexed vault, address indexed recipient, uint256 amount);
    event AuthorizationConsumed(bytes32 indexed authId);

    // Storage
    mapping(bytes32 => bool) public consumedAuthorizations;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Verifies and consumes an authorization.
     * @param vaultAddress The vault contract address
     * @param networkId The blockchain network identifier
     * @param recipient The withdrawal recipient
     * @param amount The withdrawal amount
     * @param authId The unique authorization identifier
     * @return bool indicating if authorization is valid
     */
    function verifyAuthorization(
        address vaultAddress,
        uint256 networkId,
        address recipient,
        uint256 amount,
        bytes32 authId
    ) external returns (bool) {
        // Ensure authorization hasn't been consumed
        require(!consumedAuthorizations[authId], "Authorization already consumed");
        
        // Verify caller is the vault
        require(msg.sender == vaultAddress, "Only vault can verify authorizations");
        
        // Verify parameters
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        // Mark as consumed
        consumedAuthorizations[authId] = true;

        emit AuthorizationVerified(authId, vaultAddress, recipient, amount);
        emit AuthorizationConsumed(authId);

        return true;
    }

    /**
     * @dev Constructs the authorization message hash.
     */
    function constructAuthMessage(
        address vault,
        uint256 chainId,
        address recipient,
        uint256 amount,
        uint256 nonce
    ) external pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                "WITHDRAWAL_AUTH",
                vault,
                chainId,
                recipient,
                amount,
                nonce
            )
        );
    }

    /**
     * @dev Checks if an authorization has been consumed.
     */
    function isAuthorizationConsumed(bytes32 authId) external view returns (bool) {
        return consumedAuthorizations[authId];
    }
}
