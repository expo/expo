import * as ExpoNativeCrypto from 'expo-crypto';
import * as ExpoRandom from 'expo-random';
import invariant from 'invariant';
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
async function getRandomValuesAsync(arr) {
    const orig = arr;
    if (arr.byteLength !== arr.length) {
        // Get access to the underlying raw bytes
        arr = new Uint8Array(arr.buffer);
    }
    const bytes = await ExpoRandom.getRandomBytesAsync(arr.length);
    for (var i = 0; i < bytes.length; i++) {
        arr[i] = bytes[i];
    }
    return orig;
}
function convertBufferToString(buffer) {
    const state = [];
    for (let i = 0; i < buffer.byteLength; i += 1) {
        const index = buffer[i] % CHARSET.length;
        state.push(CHARSET[index]);
    }
    return state.join('');
}
function convertToUrlSafeString(b64) {
    return b64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
// TODO(Bacon): Change this to be sync in the future when Expo unimodules support sync methods
export async function generateRandomAsync(size) {
    const buffer = new Uint8Array(size);
    await getRandomValuesAsync(buffer);
    return convertBufferToString(buffer);
}
/**
 * Proof key for Code Exchange by OAuth Public Clients (RFC 7636), Section 4.1
 * https://tools.ietf.org/html/rfc7636#section-4.1
 */
async function deriveChallengeAsync(code) {
    // 43 is the minimum, and 128 is the maximum.
    invariant(code.length > 42 && code.length < 129, 'Invalid code length for PKCE.');
    const buffer = await ExpoNativeCrypto.digestStringAsync(ExpoNativeCrypto.CryptoDigestAlgorithm.SHA256, code, { encoding: ExpoNativeCrypto.CryptoEncoding.BASE64 });
    return convertToUrlSafeString(buffer);
}
export async function buildCodeAsync(size = 128) {
    // This method needs to be resolved like all other native methods.
    const codeVerifier = await generateRandomAsync(size);
    const codeChallenge = await deriveChallengeAsync(codeVerifier);
    return { codeVerifier, codeChallenge };
}
//# sourceMappingURL=PKCE.js.map