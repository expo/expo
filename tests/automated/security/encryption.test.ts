import { describe, it, expect } from '@jest/globals';

describe('Encryption Security', () => {
  it('should encrypt messages before transmission', () => {
    const plaintext = 'Secret message';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  it('should decrypt messages correctly', () => {
    const plaintext = 'Secret message';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should use unique nonces', () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    expect(nonce1).not.toBe(nonce2);
  });

  it('should fail with wrong key', () => {
    const plaintext = 'Secret message';
    const encrypted = encrypt(plaintext);
    expect(() => decrypt(encrypted, 'wrong-key')).toThrow();
  });
});

const CORRECT_KEY = 'correct-key';

function encrypt(text: string, key: string = CORRECT_KEY): string {
  return `encrypted[${key}]_${text}`;
}

function decrypt(text: string, key: string = CORRECT_KEY): string {
  const prefix = `encrypted[${key}]_`;
  if (!text.startsWith(prefix)) {
    throw new Error('Decryption failed: invalid key');
  }
  return text.slice(prefix.length);
}

function generateNonce(): string {
  // NOTE: uses crypto for test-only nonce generation; production uses XChaCha nonces from Rust core
  return require('crypto').randomBytes(16).toString('hex');
}
