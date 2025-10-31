import { AgeRangeRequest, AgeRangeResponse } from './ExpoAgeRange.types';
/**
 * Prompts user to declare their age range.
 * @return A promise that resolves with user's age range response. Or rejects with an error (TODO vonovak export the error codes?).
 * @platform ios 26.0+
 * @platform android
 */
export declare function requestAgeRangeAsync(options: AgeRangeRequest): Promise<AgeRangeResponse>;
//# sourceMappingURL=AgeRange.d.ts.map