import { toByteArray } from 'base64-js';
import { UnavailabilityError } from 'expo-modules-core';
import ExpoRandom from './ExpoRandom';
const warnIsDeprecated = (functionName) => console.warn(`expo-random is deprecated in favor of expo-crypto: use ExpoCrypto.${functionName}()instead. https://docs.expo.dev/versions/latest/sdk/crypto/`);
function assertByteCount(value, methodName) {
    warnIsDeprecated('assertByteCount');
    if (typeof value !== 'number' ||
        isNaN(value) ||
        Math.floor(value) < 0 ||
        Math.floor(value) > 1024) {
        throw new TypeError(`expo-random: ${methodName}(${value}) expected a valid number from range 0...1024`);
    }
}
// @needsAudit
/**
 * Generates completely random bytes using native implementations. The `byteCount` property
 * is a `number` indicating the number of bytes to generate in the form of a `Uint8Array`.
 * Falls back to `Math.random` during development to prevent issues with React Native Debugger.
 * @param byteCount - A number within the range from `0` to `1024`. Anything else will throw a `TypeError`.
 * @return An array of random bytes with the same length as the `byteCount`.
 */
export function getRandomBytes(byteCount) {
    warnIsDeprecated('getRandomBytes');
    assertByteCount(byteCount, 'getRandomBytes');
    const validByteCount = Math.floor(byteCount);
    if (__DEV__) {
        if (!global.nativeCallSyncHook || global.__REMOTEDEV__) {
            // remote javascript debugging is enabled
            const array = new Uint8Array(validByteCount);
            for (let i = 0; i < validByteCount; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        }
    }
    if (ExpoRandom.getRandomBytes) {
        return ExpoRandom.getRandomBytes(validByteCount);
    }
    else if (ExpoRandom.getRandomBase64String) {
        const base64 = ExpoRandom.getRandomBase64String(validByteCount);
        return toByteArray(base64);
    }
    else {
        throw new UnavailabilityError('expo-random', 'getRandomBytes');
    }
}
// @needsAudit
/**
 * Generates completely random bytes using native implementations. The `byteCount` property
 * is a `number` indicating the number of bytes to generate in the form of a `Uint8Array`.
 * @param byteCount - A number within the range from `0` to `1024`. Anything else will throw a `TypeError`.
 * @return A promise that fulfills with an array of random bytes with the same length as the `byteCount`.
 */
export async function getRandomBytesAsync(byteCount) {
    warnIsDeprecated('getRandomBytesAsync');
    assertByteCount(byteCount, 'getRandomBytesAsync');
    const validByteCount = Math.floor(byteCount);
    if (ExpoRandom.getRandomBytesAsync) {
        return await ExpoRandom.getRandomBytesAsync(validByteCount);
    }
    else if (ExpoRandom.getRandomBase64StringAsync) {
        const base64 = await ExpoRandom.getRandomBase64StringAsync(validByteCount);
        return toByteArray(base64);
    }
    else {
        throw new UnavailabilityError('expo-random', 'getRandomBytesAsync');
    }
}
//# sourceMappingURL=Random.js.map