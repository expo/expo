import ExpoAgeRange from './ExpoAgeRange';
/**
 * Prompts the user to share their age range with the app. Responses may be cached by the OS for future requests.
 * @return A promise that resolves with user's age range response, or rejects with an error.
 * The user needs to be signed in on the device to get a valid response.
 * When not supported (earlier than iOS 26 and web), the call returns `lowerBound: 18`, which is equivalent to the response of an adult user.
 *
 *
 * @platform android
 * @platform ios 26.0+
 */
export async function requestAgeRangeAsync(options) {
    return ExpoAgeRange.requestAgeRangeAsync(options);
}
/**
 * Asks the OS whether age-assurance regulation applies to the current user. Apple
 * uses this to signal that the account region is covered by a law such as
 * Utah's or Louisiana's age-assurance requirements, so apps can avoid gating
 * users in jurisdictions where the rules do not apply.
 *
 * - Resolves with `true` only when Apple confirms regulation applies.
 * - Resolves with `false` when the OS confirms regulation does not apply.
 * - Resolves with `null` on iOS earlier than 26.2, on Android and web, or when
 *   the underlying call throws. Treat `null` as "unknown" rather than a
 *   definitive `false`.
 *
 * Recommended pattern: call this first and short-circuit your age gate when
 * the result is `false` before invoking {@link requestAgeRangeAsync}.
 *
 * @platform ios 26.2+
 */
export async function isEligibleForAgeFeaturesAsync() {
    return ExpoAgeRange.isEligibleForAgeFeaturesAsync();
}
//# sourceMappingURL=AgeRange.js.map