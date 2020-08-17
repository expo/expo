import { UnavailabilityError } from '@unimodules/core';
import { toByteArray } from 'base64-js';

import ExpoRandom from './ExpoRandom';

function assertByteCount(value: any, methodName: string): void {
  if (
    typeof value !== 'number' ||
    isNaN(value) ||
    Math.floor(value) < 0 ||
    Math.floor(value) > 1024
  ) {
    throw new TypeError(
      `expo-random: ${methodName}(${value}) expected a valid number from range 0...1024`
    );
  }
}

export function getRandomBytes(byteCount: number): Uint8Array {
  assertByteCount(byteCount, 'getRandomBytes');
  const validByteCount = Math.floor(byteCount);
  if (ExpoRandom.getRandomBytes) {
    return ExpoRandom.getRandomBytes(validByteCount);
  } else if (ExpoRandom.getRandomBase64String) {
    const base64 = ExpoRandom.getRandomBase64String(validByteCount);
    return toByteArray(base64);
  } else {
    throw new UnavailabilityError('expo-random', 'getRandomBytes');
  }
}

export async function getRandomBytesAsync(byteCount: number): Promise<Uint8Array> {
  assertByteCount(byteCount, 'getRandomBytesAsync');
  const validByteCount = Math.floor(byteCount);
  if (ExpoRandom.getRandomBytesAsync) {
    return await ExpoRandom.getRandomBytesAsync(validByteCount);
  } else if (ExpoRandom.getRandomBase64StringAsync) {
    const base64 = await ExpoRandom.getRandomBase64StringAsync(validByteCount);
    return toByteArray(base64);
  } else {
    throw new UnavailabilityError('expo-random', 'getRandomBytesAsync');
  }
}
