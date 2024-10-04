import * as Crypto from 'expo-crypto';
import invariant from 'invariant';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function getRandomValues(input: Uint8Array): Uint8Array {
  const output = input;
  // Get access to the underlying raw bytes
  if (input.byteLength !== input.length) input = new Uint8Array(input.buffer);

  const bytes = Crypto.getRandomBytes(input.length);

  for (let i = 0; i < bytes.length; i++) input[i] = bytes[i];

  return output;
}

function convertBufferToString(buffer: Uint8Array): string {
  const state: string[] = [];
  for (let i = 0; i < buffer.byteLength; i += 1) {
    const index = buffer[i] % CHARSET.length;
    state.push(CHARSET[index]);
  }
  return state.join('');
}

function convertToUrlSafeString(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function generateRandom(size: number): string {
  const buffer = new Uint8Array(size);
  getRandomValues(buffer);
  return convertBufferToString(buffer);
}

/**
 * Proof key for Code Exchange by OAuth Public Clients (RFC 7636), Section 4.1
 * [Section 4.1](https://tools.ietf.org/html/rfc7636#section-4.1)
 */
export async function deriveChallengeAsync(code: string): Promise<string> {
  // 43 is the minimum, and 128 is the maximum.
  invariant(code.length > 42 && code.length < 129, 'Invalid code length for PKCE.');

  const buffer = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, code, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  return convertToUrlSafeString(buffer);
}

export async function buildCodeAsync(
  size: number = 128
): Promise<{ codeChallenge: string; codeVerifier: string }> {
  // This method needs to be resolved like all other native methods.
  const codeVerifier = generateRandom(size);
  const codeChallenge = await deriveChallengeAsync(codeVerifier);

  return { codeVerifier, codeChallenge };
}

/**
 * Digest a random string with hex encoding, useful for creating `nonce`s.
 */
export async function generateHexStringAsync(size: number): Promise<string> {
  const value = generateRandom(size);
  const buffer = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
  return convertToUrlSafeString(buffer);
}
