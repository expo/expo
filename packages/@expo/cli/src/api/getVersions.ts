import { createCachedFetch } from './rest/client';
import { CommandError } from '../utils/errors';

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

  expoVersion?: string;

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
    // We'll use a 5 minute cache to ensure we stay relatively up to date.
    ttl: 1000 * 60 * 5,
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
