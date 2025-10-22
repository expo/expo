import ExpoAgeRange from './ExpoAgeRange';
/**
 * Prompts the user to share their age range with the app. Responses may be cached by the OS for future requests.
 * @return A promise that resolves with user's age range response, or rejects with an error.
 * The user needs to be signed in on the device to get a valid response.
 * When not supported (iOS < 26.0 and web), the call returns `lowerBound: 18`, equivalent to the response of an adult user.
 *
 * (TODO vonovak export the error codes?).
 *
 * @platform android
 * @platform ios 26.0+
 */
export async function requestAgeRangeAsync(options) {
    return ExpoAgeRange.requestAgeRangeAsync(options);
}
//# sourceMappingURL=AgeRange.js.map