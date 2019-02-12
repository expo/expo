import { UnavailabilityError } from 'expo-errors';
import { toByteArray } from 'base64-js';
import ExpoRandom from './ExpoRandom';
export async function getRandomBytesAsync(byteCount) {
    if (ExpoRandom.getRandomBytesAsync) {
        return await ExpoRandom.getRandomBytesAsync(byteCount);
    }
    else if (ExpoRandom.getRandomBase64StringAsync) {
        const base64 = await ExpoRandom.getRandomBase64StringAsync(byteCount);
        return toByteArray(base64);
    }
    else {
        throw new UnavailabilityError('expo-random', 'getRandomBytesAsync');
    }
}
//# sourceMappingURL=Random.js.map