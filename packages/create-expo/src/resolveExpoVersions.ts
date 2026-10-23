const debug = require('debug')('expo:versions') as typeof console.log;

/**
 * The Expo Go versions endpoint, including the root property `expoGoSdkVersion`.
 * This `expoGoSdkVersion` property tells us what Expo SDK version is compatible with Expo Go on the store.
 */
const EXPO_VERSIONS_URL = 'https://api.expo.dev/v2/versions';

type ExpoSdkVersion = `${string}.${string}.${string}`;

interface ExpoVersionsResponse {
  expoGoSdkVersion: ExpoSdkVersion;
  sdkVersions: Record<string, { releaseNoteUrl?: string; isDeprecated?: boolean }>;
}

/** Resolve the Expo SDK version compatible with Expo Go on the app stores */
async function fetchExpoSdkVersions(): Promise<ExpoVersionsResponse | null> {
  return await fetch(EXPO_VERSIONS_URL).then(
    (response) => {
      if (response.ok) return response.json() as Promise<ExpoVersionsResponse>;
      debug('Failed to fetch versions endpoint, received status: %d', response.status);
      return null;
    },
    (error) => {
      debug('Failed to fetch versions endpoint: %O', error);
      return null;
    }
  );
}

/**
 * Resolve the latest Expo SDK version, and the latest Expo Go-compatible version.
 * By default, we use the Expo Go-compatible version.
 * To inform users on how to override this, we need to know both versions.
 */
export async function resolveExpoVersions() {
  const versions = await fetchExpoSdkVersions();
  if (!versions) return null;

  const available = Object.entries(versions.sdkVersions ?? {})
    .filter(([, info]) => !!info.releaseNoteUrl && !info.isDeprecated)
    .map(([version]) => parseMajorVersion(version))
    .filter((major): major is number => major != null)
    .sort((a, b) => a - b);

  return {
    latestVersion: available.pop() ?? null,
    expoGoVersion: parseMajorVersion(versions.expoGoSdkVersion),
  };
}

/** Extract the major number from a semver version or range */
function parseMajorVersion(semver: string) {
  const major = parseInt(semver.split('.', 1).shift() ?? '', 10);
  return Number.isFinite(major) ? major : null;
}
