import * as Crypto from 'expo-crypto';

// Transporter uses the Crypto module internally to generate unique global IDs.
// Unfortunately, Hermes requires a polyfill for `crypto`.
if (typeof globalThis.crypto === 'undefined') {
  // @ts-ignore
  globalThis.crypto = Crypto;
}
