import type { AgeRangeRequest, AgeRangeResponse, RegulatoryFeature } from './ExpoAgeRange.types';

export async function requestAgeRangeAsync(_: AgeRangeRequest): Promise<AgeRangeResponse> {
  return { lowerBound: 18, upperBound: null };
}

export async function isEligibleForAgeFeaturesAsync(): Promise<boolean | null> {
  return null;
}

export async function showSignificantUpdateAcknowledgmentAsync(
  _updateDescription: string
): Promise<void> {
  // no-op on web
}

export async function getRequiredRegulatoryFeaturesAsync(): Promise<RegulatoryFeature[] | null> {
  return null;
}
