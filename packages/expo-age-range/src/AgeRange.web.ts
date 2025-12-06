import type { AgeRangeRequest, AgeRangeResponse } from './ExpoAgeRange.types';

export async function requestAgeRangeAsync(_: AgeRangeRequest): Promise<AgeRangeResponse> {
  return { lowerBound: 18 };
}
