import { UnavailabilityError } from '@unimodules/core';
import { toByteArray } from 'base64-js';
import ExpoRandom from './ExpoRandom';
function assertByteCount(value) {
    if (typeof value !== 'number' ||
        isNaN(value) ||
        Math.floor(value) < 0 ||
        Math.floor(value) > 1024) {
        throw new TypeError(`expo-random: getRandomBytesAsync(${value}) expected a valid number from range 0...1024`);
    }
}
export async function getRandomBytesAsync(byteCount) {
    assertByteCount(byteCount);
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