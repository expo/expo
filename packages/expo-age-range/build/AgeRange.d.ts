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
 * Displays a system-provided interface for people to acknowledge a significant app update.
 * @param updateDescription A description of the significant update to show to the user.
 * @return A promise that resolves when the user acknowledges the update, or rejects with an error.
 *
 * @platform ios 26.0+
 */
export declare function showSignificantUpdateAcknowledgementAsync(updateDescription: string): Promise<void>;
//# sourceMappingURL=AgeRange.d.ts.map