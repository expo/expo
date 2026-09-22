import getDevServer from '../utils/getDevServer';

let cachedBaseUrl: string | null = null;

/**
 * Get the base URL for the DOM Components HTML
 */
export function getBaseURL(): string {
  if (cachedBaseUrl != null) {
    return cachedBaseUrl;
  }

  // Serving from updates
  const updatesBaseUrl = getUpdatesBaseURL();
  if (updatesBaseUrl != null) {
    cachedBaseUrl = updatesBaseUrl;
    return cachedBaseUrl;
  }

  if (process.env.EXPO_OS === 'web') {
    cachedBaseUrl = process.env.EXPO_BASE_URL ?? '';
    return cachedBaseUrl;
  }

  // Serving from local production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.EXPO_OS === 'android') {
      cachedBaseUrl = 'file:///android_asset/www.bundle';
    } else if (process.env.EXPO_OS === 'ios') {
      cachedBaseUrl = 'www.bundle';
    } else {
      cachedBaseUrl = process.env.EXPO_BASE_URL ?? '';
    }
    return cachedBaseUrl;
  }

  // Serving from local dev server
  const devServer = getDevServer();
  cachedBaseUrl = new URL('/_expo/@dom', devServer.url).toString();
  return cachedBaseUrl;
}

/**
 * The path segment of the directory that `expo-updates` downloads an update's assets into.
 * It is the same name on Android and iOS.
 */
const UPDATES_DIRECTORY_SEGMENT = '/.expo-internal/';

/**
 * Get the base URL for the DOM Components when serving from updates
 */
function getUpdatesBaseURL(): string | null {
  const ExpoUpdates = globalThis.expo?.modules?.['ExpoUpdates'] as
    | import('expo-updates').ExpoUpdatesModule
    | undefined;
  const updatesIsInstalledAndEnabled = ExpoUpdates?.isEnabled ?? false;
  const updatesIsEmbeddedLaunch = ExpoUpdates?.isEmbeddedLaunch ?? false;
  const shouldServeDomFromUpdates = updatesIsInstalledAndEnabled && !updatesIsEmbeddedLaunch;
  // If updates is installed and enabled, and we're not running from an embedded launch, we should serve the DOM Components from the `.expo-internal` directory
  if (shouldServeDomFromUpdates) {
    const localAssets = ExpoUpdates?.localAssets ?? {};
    // `localAssets` also holds the embedded assets, which `expo-updates` serves from the app
    // binary rather than from the updates directory. Their directory is not where this update's
    // DOM Components HTML is, and the order of the map is not defined, so only accept an asset
    // that `expo-updates` downloaded into the updates directory.
    const updatesDirectoryAsset = Object.values(localAssets).find((asset) =>
      asset.includes(UPDATES_DIRECTORY_SEGMENT)
    );
    if (updatesDirectoryAsset) {
      const segmentIndex = updatesDirectoryAsset.indexOf(UPDATES_DIRECTORY_SEGMENT);
      return updatesDirectoryAsset.slice(
        0,
        segmentIndex + UPDATES_DIRECTORY_SEGMENT.length - 1 // keep `.expo-internal`, drop the trailing slash
      );
    }
  }
  return null;
}
