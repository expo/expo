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
  const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer').default;
  const devServer = getDevServer();
  cachedBaseUrl = new URL('/_expo/@dom', devServer.url).toString();
  return cachedBaseUrl;
}

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
    const anyLocalAsset = Object.values(localAssets)[0];
    if (anyLocalAsset) {
      // Try to get the `.expo-internal` directory from the first local asset
      return anyLocalAsset.slice(0, anyLocalAsset.lastIndexOf('/'));
    }
  }
  return null;
}
