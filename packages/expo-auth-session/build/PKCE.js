import * as Crypto from 'expo-crypto';
import invariant from 'invariant';
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function convertBufferToString(buffer) {
    const state = [];
    for (let i = 0; i < buffer.byteLength; i += 1) {
        const index = buffer[i] % CHARSET.length;
        state.push(CHARSET[index]);
    }
    return state.join('');
}
function convertToUrlSafeString(b64) {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
export function generateRandom(size) {
    const buffer = Crypto.getRandomValues(new Uint8Array(size));
    return convertBufferToString(buffer);
}
/**
 * Proof key for Code Exchange by OAuth Public Clients (RFC 7636), Section 4.1
 * [Section 4.1](https://tools.ietf.org/html/rfc7636#section-4.1)
 */
export async function deriveChallengeAsync(code) {
    // 43 is the minimum, and 128 is the maximum.
    invariant(code.length > 42 && code.length < 129, 'Invalid code length for PKCE.');
    const buffer = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, code, {
        encoding: Crypto.CryptoEncoding.BASE64,
    });
    return convertToUrlSafeString(buffer);
}
export async function buildCodeAsync(size = 128) {
    // This method needs to be resolved like all other native methods.
    const codeVerifier = generateRandom(size);
    const codeChallenge = await deriveChallengeAsync(codeVerifier);
    return { codeVerifier, codeChallenge };
}
/**
 * Digest a random string with hex encoding, useful for creating `nonce`s.
 */
export async function generateHexStringAsync(size) {
    const value = generateRandom(size);
    const buffer = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
        encoding: Crypto.CryptoEncoding.HEX,
    });
    return convertToUrlSafeString(buffer);
}
//# sourceMappingURL=PKCE.js.map