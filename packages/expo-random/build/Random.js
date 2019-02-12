import { UnavailabilityError } from 'expo-errors';
import { toByteArray } from 'base64-js';
import ExpoRandom from './ExpoRandom';
export async function getRandomIntegerAsync(length) {
    if (!ExpoRandom.getRandomIntegerAsync) {
        throw new UnavailabilityError('expo-random', 'getRandomIntegerAsync');
    }
    const randomBytes = await ExpoRandom.getRandomIntegerAsync(length);
    return toByteArray(randomBytes);
}
//# sourceMappingURL=Random.js.map