import type { AgeRangeRequest, AgeRangeResponse } from './ExpoAgeRange.types';
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
export declare function requestAgeRangeAsync(options: AgeRangeRequest): Promise<AgeRangeResponse>;
/**
 * Asks the OS whether age-assurance regulation applies to the current user. Apple
 * uses this to signal that the account region is covered by a law such as
 * Utah's or Louisiana's age-assurance requirements, so apps can avoid gating
 * users in jurisdictions where the rules do not apply.
 *
 * - Resolves with `true` only when Apple confirms regulation applies.
 * - Resolves with `false` when the OS confirms regulation does not apply.
 * - Resolves with `null` on iOS earlier than 26.2, and on Android and web.
 *   Treat `null` as "unknown" rather than a definitive `false`.
 * - Rejects when the request fails — see [AgeRangeService.Error](https://developer.apple.com/documentation/declaredagerange/agerangeservice/error)
 *   for more information. Treat rejection as "unknown" and fall through to [`requestAgeRangeAsync`](#agerangerequestagerangeasyncoptions)
 *   or your own gating logic.
 *
 * Recommended pattern: call this first and only prompt the user for their age
 * range when the result is not `false`. When it is `false`, the user is outside
 * a regulated jurisdiction and you can skip the age gate entirely.
 *
 * @example
 * ```ts
 * try {
 *   const eligible = await isEligibleForAgeFeaturesAsync();
 *   if (eligible === false) {
 *     // Regulation does not apply — no age gate needed.
 *     return;
 *   }
 * } catch {
 *   // Treat errors as "unknown" and fall through to the prompt below or your own gating logic.
 * }
 *
 * const ageRange = await requestAgeRangeAsync({ threshold1: 18 });
 * ```
 *
 * @platform ios 26.2+
 */
export declare function isEligibleForAgeFeaturesAsync(): Promise<boolean | null>;
//# sourceMappingURL=AgeRange.d.ts.map