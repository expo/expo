import type {
  AgeRangeRequest,
  AgeRangeResponse,
  AgeRangeRegulatoryFeature,
  AgeSignalsStatus,
  FakeAgeSignals,
} from './ExpoAgeRange.types';

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

export async function getRequiredRegulatoryFeaturesAsync(): Promise<
  AgeRangeRegulatoryFeature[] | null
> {
  return null;
}

export async function requestAgeSignalsAccessAsync(): Promise<AgeSignalsStatus | null> {
  return null;
}

export function setFakeAgeSignals(_fake: FakeAgeSignals | null): void {
  // no-op on web
}
