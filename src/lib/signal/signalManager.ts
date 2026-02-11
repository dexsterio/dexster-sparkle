/**
 * Signal Protocol Manager - Placeholder
 * 
 * This module handles E2E encryption via Signal Protocol (WASM-based).
 * In production, this would use libsignal-client or @nicktomlin/libsignal-protocol-typescript.
 * 
 * Key bundle schema (POST /api/messages/keys/bundle):
 * {
 *   identityPublicKey: string (base64, REQUIRED),
 *   registrationId: number (REQUIRED),
 *   signedPreKey: { id: number, publicKey: string (base64), signature: string (base64) },
 *   preKeys: [{ id: number, publicKey: string (base64) }] (max 100),
 *   kyberPreKey?: { id: number, publicKey: string (base64), signature: string (base64) }
 * }
 * 
 * Encrypt output:
 * {
 *   encryptedContent: string (base64 ciphertext),
 *   nonce: string,
 *   senderKeyVersion: number,
 *   signalMessageType: 2 | 3  // NUMBER, NOT STRING
 *   // 2 = PreKeySignalMessage (first message, new session)
 *   // 3 = SignalMessage (subsequent messages in established session)
 * }
 */

import api from '@/lib/api';

export interface EncryptedPayload {
  encryptedContent: string; // base64
  nonce: string;
  senderKeyVersion: number;
  signalMessageType: 2 | 3;
}

export interface KeyBundle {
  identityPublicKey: string;
  registrationId: number;
  signedPreKey: {
    id: number;
    publicKey: string;
    signature: string;
  };
  preKeys: Array<{ id: number; publicKey: string }>;
  kyberPreKey?: {
    id: number;
    publicKey: string;
    signature: string;
  };
}

class SignalManager {
  private initialized = false;

  /**
   * Fetch a user's key bundle for establishing a Signal session
   */
  async fetchKeyBundle(userId: number): Promise<KeyBundle> {
    return api.get<KeyBundle>(`/messages/keys/bundle/${userId}`);
  }

  /**
   * Upload our own key bundle to the server
   */
  async uploadKeyBundle(bundle: KeyBundle): Promise<void> {
    await api.post('/messages/keys/bundle', bundle);
  }

  /**
   * Replenish one-time pre-keys when count is low
   */
  async replenishPreKeys(): Promise<void> {
    await api.put('/messages/keys/replenish');
  }

  /**
   * Rotate our signed pre-key
   */
  async rotateSignedPreKey(): Promise<void> {
    await api.put('/messages/keys/signed');
  }

  /**
   * Get count of remaining pre-keys on server
   */
  async getKeyCount(): Promise<{ count: number }> {
    return api.get('/messages/keys/count');
  }

  /**
   * Get key status
   */
  async getKeyStatus(): Promise<unknown> {
    return api.get('/messages/keys/status');
  }

  /**
   * Encrypt plaintext for a recipient.
   * 
   * TODO: Implement actual Signal Protocol encryption using WASM.
   * Reference: src/Arkiv/lib/chatApi.ts on the server has working implementation.
   * 
   * For now, returns base64-encoded plaintext as a placeholder.
   * This WILL NOT work with real E2E conversations — the server expects
   * actual Signal Protocol ciphertext.
   */
  async encrypt(recipientId: number, plaintext: string): Promise<EncryptedPayload> {
    // PLACEHOLDER — replace with real Signal Protocol encryption
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const base64 = btoa(String.fromCharCode(...data));
    
    return {
      encryptedContent: base64,
      nonce: '',
      senderKeyVersion: 1,
      signalMessageType: 3, // Assume established session
    };
  }

  /**
   * Decrypt ciphertext from a sender.
   * 
   * TODO: Implement actual Signal Protocol decryption using WASM.
   * 
   * For now, attempts to base64-decode as plaintext (matches the placeholder encrypt above).
   */
  async decrypt(
    senderId: number,
    encryptedContent: string,
    _nonce: string,
    _senderKeyVersion: number,
    _signalMessageType: 2 | 3,
  ): Promise<string> {
    // PLACEHOLDER — replace with real Signal Protocol decryption
    try {
      const binary = atob(encryptedContent);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      return '[Encrypted message — decryption not available]';
    }
  }

  /**
   * Establish a Signal session with a recipient (fetch their key bundle, process it).
   * TODO: Implement actual session establishment.
   */
  async establishSession(userId: number): Promise<void> {
    // Fetch key bundle — session establishment would happen here
    await this.fetchKeyBundle(userId);
    // TODO: Process key bundle with Signal Protocol library
  }
}

export const signalManager = new SignalManager();
export default signalManager;
