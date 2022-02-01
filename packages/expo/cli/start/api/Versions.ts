import { ExpoConfig } from '@expo/config-types';
import semver from 'semver';

import { apiClient } from '../../utils/api';
import { EXPO_BETA } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { pickBy } from '../../utils/obj';
import { Cache } from './Cache';

export type SDKVersion = {
  androidExpoViewUrl?: string;
  expoReactNativeTag: string;
  /* deprecated */ exponentReactNativeTag?: string;
  expokitNpmPackage?: string;
  facebookReactNativeVersion: string;
  facebookReactVersion?: string;
  iosExpoViewUrl?: string;
  /* deprecated */ iosExponentViewUrl?: string;
  iosVersion?: string;
  isDeprecated?: boolean;
  packagesToInstallWhenEjecting?: { [name: string]: string };
  releaseNoteUrl?: string;
  iosClientUrl?: string;
  iosClientVersion?: string;
  androidClientUrl?: string;
  androidClientVersion?: string;
  relatedPackages?: { [name: string]: string };
  beta?: boolean;
};

export type SDKVersions = { [version: string]: SDKVersion };
type TurtleSDKVersionsOld = { android: string; ios: string };

type Versions = {
  androidUrl: string;
  androidVersion: string;
  iosUrl: string;
  iosVersion: string;
  sdkVersions: SDKVersions;
  /* deprecated */ starterApps: unknown;
  /* deprecated */ templates: unknown[];
  /* deprecated */ templatesv2: unknown[];
  turtleSdkVersions: TurtleSDKVersionsOld;
};

/** Get versions from remote endpoint. */
export async function getVersionsAsync(options?: { skipCache?: boolean }): Promise<Versions> {
  const versionCache = new Cache({
    getAsync: () =>
      apiClient
        .get('versions/latest')
        .json<{ data: Versions }>()
        .then(({ data }) => data),
    filename: 'versions.json',
    ttlMilliseconds: 0,
  });

  // Clear cache when opting in to beta because things can change quickly in beta
  if (EXPO_BETA || options?.skipCache) {
    versionCache.clearAsync();
  }

  return await versionCache.getAsync();
}

// NOTE(brentvatne): it is possible for an unreleased version to be published to
// the versions endpoint, but in some cases we only want to list out released
// versions
export async function getReleasedVersionsAsync(): Promise<SDKVersions> {
  const { sdkVersions } = await getVersionsAsync();
  return pickBy(
    sdkVersions,
    (data, _sdkVersionString) => !!data.releaseNoteUrl || (EXPO_BETA && data.beta)
  );
}

/** v1 >= v2. UNVERSIONED == true. nullish == false.  */
export function gte(v1: ExpoConfig['sdkVersion'], sdkVersion: string): boolean {
  if (!v1) {
    return false;
  }

  if (v1 === 'UNVERSIONED') {
    return true;
  }

  try {
    return semver.gte(v1, sdkVersion);
  } catch (e) {
    throw new CommandError(
      'INVALID_VERSION',
      `'${v1}' is not a valid version. Must be in the form of x.y.z`
    );
  }
}

/** v1 <= v2. UNVERSIONED == false. nullish == false.  */
export function lte(v1: ExpoConfig['sdkVersion'], v2: string): boolean {
  if (!v1 || v1 === 'UNVERSIONED') {
    return false;
  }

  try {
    return semver.lte(v1, v2);
  } catch {
    throw new CommandError(
      'INVALID_VERSION',
      `'${v1}' is not a valid version. Must be in the form of x.y.z`
    );
  }
}

/** Asserts that an SDK version string is a valid Expo SDK version. */
export function assertValid(sdkVersion: string): boolean {
  if (sdkVersion === 'UNVERSIONED') {
    return true;
  }

  if (semver.valid(sdkVersion) == null) {
    throw new CommandError(
      'INVALID_VERSION',
      `"${sdkVersion}" is not a valid version. Must be in the form of x.y.z`
    );
  }
  return true;
}

// NOTE(brentvatne): it is possible for an unreleased version to be published to
// the versions endpoint, but in some cases we need to get the latest *released*
// version, not just the latest version.
export async function getLatestVersionAsync(): Promise<{
  version: string;
  data: SDKVersion | null;
}> {
  const { sdkVersions } = await getVersionsAsync();

  let result = null;
  let highestMajorVersion = '0.0.0';

  for (const [version, data] of Object.entries(sdkVersions)) {
    const hasReleaseNotes = !!data.releaseNoteUrl;
    const isBeta = !!data.beta;

    if (
      semver.major(version) > semver.major(highestMajorVersion) &&
      (hasReleaseNotes || (isBeta && EXPO_BETA))
    ) {
      highestMajorVersion = version;
      result = data;
    }
  }
  return {
    version: highestMajorVersion,
    data: result,
  };
}

/** Returns the major version number for the last supported SDK version. */
export async function getLastSupportedMajorVersionAsync(): Promise<number> {
  const { sdkVersions } = await getVersionsAsync();
  const supportedVersions = pickBy(sdkVersions, (v) => !v.isDeprecated);
  const versionNumbers = Object.keys(supportedVersions).map((version) => semver.major(version));
  return Math.min(...versionNumbers);
}
