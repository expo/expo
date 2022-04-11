import { EXPO_BETA } from '../utils/env';
import { CommandError } from '../utils/errors';
import { pickBy } from '../utils/obj';
import { createCachedFetch } from './rest/client';

/** Represents version info for a particular SDK. */
export type SDKVersion = {
  /** @example "2.16.1" */
  iosVersion?: string;
  /** @example "https://dpq5q02fu5f55.cloudfront.net/Exponent-2.17.4.tar.gz" */
  iosClientUrl?: string;
  /** @example "https://dev.to/expo/expo-sdk-38-is-now-available-5aa0" */
  releaseNoteUrl?: string;
  /** @example "2.17.4" */
  iosClientVersion?: string;
  /** @example "https://d1ahtucjixef4r.cloudfront.net/Exponent-2.16.1.apk" */
  androidClientUrl?: string;
  /** @example "2.16.1" */
  androidClientVersion?: string;
  /** @example { "typescript": "~3.9.5" } */
  relatedPackages?: Record<string, string>;

  facebookReactNativeVersion: string;

  facebookReactVersion?: string;

  beta?: boolean;
};

export type SDKVersions = Record<string, SDKVersion>;

export type Versions = {
  androidUrl: string;
  androidVersion: string;
  iosUrl: string;
  iosVersion: string;
  sdkVersions: SDKVersions;
};

/** Get versions from remote endpoint. */
export async function getVersionsAsync({
  skipCache,
}: { skipCache?: boolean } = {}): Promise<Versions> {
  // Reconstruct the cached fetch since caching could be disabled.
  const fetchAsync = createCachedFetch({
    skipCache,
    cacheDirectory: 'versions-cache',
    // We'll use a 1 week cache for versions so older versions get flushed out eventually.
    ttl: 1000 * 60 * 60 * 24 * 7,
  });

  const results = await fetchAsync('versions/latest');
  if (!results.ok) {
    throw new CommandError(
      'API',
      `Unexpected response when fetching version info from Expo servers: ${results.statusText}.`
    );
  }
  const json = await results.json();
  return json.data;
}

/** Get the currently released version while also accounting for if the user is running in `EXPO_BETA` mode. */
export async function getReleasedVersionsAsync({
  skipCache,
}: { skipCache?: boolean } = {}): Promise<SDKVersions> {
  // NOTE(brentvatne): it is possible for an unreleased version to be published to
  // the versions endpoint, but in some cases we only want to list out released
  // versions
  const { sdkVersions } = await getVersionsAsync({ skipCache });
  return pickBy(
    sdkVersions,
    (data, _sdkVersionString) => !!data.releaseNoteUrl || (EXPO_BETA && data.beta)
  );
}
