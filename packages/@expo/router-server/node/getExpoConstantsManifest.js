const { getConfig, getNameFromConfig } = require('expo/config');
// Use root to work better with create-react-app
const DEFAULT_LANGUAGE_ISO_CODE = `en`;
const DEFAULT_DISPLAY = 'standalone';
const DEFAULT_STATUS_BAR = 'black-translucent';
const DEFAULT_PREFER_RELATED_APPLICATIONS = true;
// Convert expo value to PWA value
function ensurePWAorientation(orientation) {
  if (orientation && typeof orientation === 'string') {
    const webOrientation = orientation.toLowerCase();
    if (webOrientation !== 'default') {
      return webOrientation;
    }
  }
  return undefined;
}

const RESTRICTED_MANIFEST_FIELDS = [
  // Omit app.json properties that get removed during the native build
  'facebookScheme',
  'facebookAppId',
  'facebookDisplayName',
  // Remove iOS and Android.
  'ios',
  'android',
  // Hide internal / build values
  'plugins',
  'hooks',
  '_internal',
  // Remove metro-specific values
  'assetBundlePatterns',
];
function getExpoConstantsManifest(projectRoot) {
  const { exp } = getConfig(projectRoot, {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  });
  const manifest = ensurePWAConfig(exp);
  for (const field of RESTRICTED_MANIFEST_FIELDS) {
    delete manifest[field];
  }
  return manifest;
}
function applyWebDefaults(appJSON) {
  // For RN CLI support
  // @ts-ignore: expo object doesn't exist on ExpoConfig
  const appManifest = appJSON.expo || appJSON || {};
  const { web: webManifest = {}, splash = {}, ios = {}, android = {} } = appManifest;
  // rn-cli apps use a displayName value as well.
  const { appName, webName } = getNameFromConfig(appJSON);
  const languageISOCode = webManifest.lang || DEFAULT_LANGUAGE_ISO_CODE;
  const primaryColor = appManifest.primaryColor;
  const description = appManifest.description;
  // The theme_color sets the color of the tool bar, and may be reflected in the app's preview in task switchers.
  const webThemeColor = webManifest.themeColor || primaryColor;
  const dir = webManifest.dir;
  const shortName = webManifest.shortName || webName;
  const display = webManifest.display || DEFAULT_DISPLAY;
  const startUrl = webManifest.startUrl;
  const { scope, crossorigin } = webManifest;
  const barStyle = webManifest.barStyle || DEFAULT_STATUS_BAR;
  const orientation = ensurePWAorientation(webManifest.orientation || appManifest.orientation);
  /**
   * **Splash screen background color**
   * `https://developers.google.com/web/fundamentals/web-app-manifest/#splash-screen`
   * The background_color should be the same color as the load page,
   * to provide a smooth transition from the splash screen to your app.
   */
  const backgroundColor = webManifest.backgroundColor || splash.backgroundColor; // No default background color
  /**
   *
   * https://developer.mozilla.org/en-US/docs/Web/Manifest#prefer_related_applications
   * Specifies a boolean value that hints for the user agent to indicate
   * to the user that the specified native applications (see below) are recommended over the website.
   * This should only be used if the related native apps really do offer something that the website can't... like Expo ;)
   *
   * >> The banner won't show up if the app is already installed:
   * https://github.com/GoogleChrome/samples/issues/384#issuecomment-326387680
   */
  const preferRelatedApplications =
    webManifest.preferRelatedApplications === undefined
      ? DEFAULT_PREFER_RELATED_APPLICATIONS
      : webManifest.preferRelatedApplications;
  const relatedApplications = inferWebRelatedApplicationsFromConfig(appManifest);
  return {
    ...appManifest,
    name: appName,
    description,
    primaryColor,
    // Ensure these objects exist
    ios: {
      ...ios,
    },
    android: {
      ...android,
    },
    web: {
      ...webManifest,
      meta: undefined,
      build: undefined,
      scope,
      crossorigin,
      description,
      preferRelatedApplications,
      relatedApplications,
      startUrl,
      shortName,
      display,
      orientation,
      dir,
      barStyle,
      backgroundColor,
      themeColor: webThemeColor,
      lang: languageISOCode,
      name: webName,
    },
  };
}
/**
 * https://developer.mozilla.org/en-US/docs/Web/Manifest#related_applications
 * An array of native applications that are installable by, or accessible to, the underlying platform
 * for example, a native Android application obtainable through the Google Play Store.
 * Such applications are intended to be alternatives to the
 * website that provides similar/equivalent functionality — like the native app version of the website.
 */
function inferWebRelatedApplicationsFromConfig({ web = {}, ios = {}, android = {} }) {
  const relatedApplications = web.relatedApplications || [];
  const { bundleIdentifier, appStoreUrl } = ios;
  if (bundleIdentifier) {
    const PLATFORM_ITUNES = 'itunes';
    const iosApp = relatedApplications.some(({ platform }) => platform === PLATFORM_ITUNES);
    if (!iosApp) {
      relatedApplications.push({
        platform: PLATFORM_ITUNES,
        url: appStoreUrl,
        id: bundleIdentifier,
      });
    }
  }
  const { package: androidPackage, playStoreUrl } = android;
  if (androidPackage) {
    const PLATFORM_PLAY = 'play';
    const alreadyHasAndroidApp = relatedApplications.some(
      ({ platform }) => platform === PLATFORM_PLAY
    );
    if (!alreadyHasAndroidApp) {
      relatedApplications.push({
        platform: PLATFORM_PLAY,
        url: playStoreUrl || `http://play.google.com/store/apps/details?id=${androidPackage}`,
        id: androidPackage,
      });
    }
  }
  return relatedApplications;
}
function ensurePWAConfig(appJSON) {
  const config = applyWebDefaults(appJSON);
  return config;
}

module.exports = {
  getExpoConstantsManifest,
};
