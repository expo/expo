import ExpoAgeRange from './ExpoAgeRange';
import type { AgeRangeRequest, AgeRangeResponse } from './ExpoAgeRange.types';

export async function requestAgeRangeAsync(options: AgeRangeRequest): Promise<AgeRangeResponse> {
  return ExpoAgeRange.requestAgeRangeAsync(options);
}
