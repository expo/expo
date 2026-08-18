import semver from 'semver';

import { assertSdkCompatibilityData, validateSdkCompatibilityData } from './schema';
import rawSdkCompatibilityData from './sdk-compatibility.json';
import type { SdkCompatibility, SdkCompatibilityData } from './types';

assertSdkCompatibilityData(rawSdkCompatibilityData);

export const sdkCompatibilityData: SdkCompatibilityData = rawSdkCompatibilityData;

export function getSdkCompatibility(sdkVersion: string): SdkCompatibility | null {
  const normalizedSdkVersion = semver.coerce(sdkVersion);
  if (!normalizedSdkVersion) {
    return null;
  }

  return (
    sdkCompatibilityData.sdkVersions.find(
      (compatibility) => semver.major(compatibility.sdk) === normalizedSdkVersion.major
    ) ?? null
  );
}

export function isXcodeVersionSupported(sdkVersion: string, xcodeVersion: string): boolean | null {
  const compatibility = getSdkCompatibility(sdkVersion);
  const normalizedXcodeVersion = semver.coerce(xcodeVersion);
  const xcodeVersionCheckRange = compatibility?.ios.xcodeVersionCheckRange;
  if (!xcodeVersionCheckRange || !normalizedXcodeVersion) {
    return null;
  }

  return semver.satisfies(normalizedXcodeVersion, xcodeVersionCheckRange);
}

export { validateSdkCompatibilityData };
export type {
  AndroidCompatibility,
  IosCompatibility,
  NodeCompatibility,
  RuntimeCompatibility,
  SdkCompatibility,
  SdkCompatibilityData,
} from './types';
