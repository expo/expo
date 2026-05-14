import type { AgeRangeRequest, AgeRangeResponse } from './ExpoAgeRange.types';

export async function requestAgeRangeAsync(_: AgeRangeRequest): Promise<AgeRangeResponse> {
  return { lowerBound: 18, upperBound: null };
}

export async function isEligibleForAgeFeaturesAsync(): Promise<boolean | null> {
  return null;
}
