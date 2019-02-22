const locations = require('./webpackLocations');
const nativeAppManifest = require(locations.appJson);

function getAppManifest() {
  if (nativeAppManifest && nativeAppManifest.expo) {
    const { expo } = nativeAppManifest;
    const PWAManifest = require(locations.template.manifest);
    const web = PWAManifest || {};

    return {
      // facebookScheme
      // facebookAppId
      // facebookDisplayName
      name: expo.name,
      description: expo.description,
      slug: expo.slug,
      sdkVersion: expo.sdkVersion,
      version: expo.version,
      githubUrl: expo.githubUrl,
      orientation: expo.orientation,
      primaryColor: expo.primaryColor,
      privacy: expo.privacy,
      icon: expo.icon,
      scheme: expo.scheme,
      notification: expo.notification,
      splash: expo.splash,
      androidShowExponentNotificationInShellApp: expo.androidShowExponentNotificationInShellApp,
      web,
    };
  }
  return {};
}
const environment = process.env.NODE_ENV || 'development';
const __DEV__ = environment !== 'production';

const ENV_VAR_REGEX = /^(EXPO_|REACT_NATIVE_)/i;

const publicUrl = '';

function getClientEnvironment() {
  let processEnv = Object.keys(process.env)
    .filter(key => ENV_VAR_REGEX.test(key))
    .reduce(
      (env, key) => {
        env[key] = JSON.stringify(process.env[key]);
        return env;
      },
      {
        // Useful for determining whether we’re running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: JSON.stringify(environment),

        // Useful for resolving the correct path to static assets in `public`.
        // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
        // This should only be used as an escape hatch. Normally you would put
        // images into the root folder and `import` them in code to get their paths.
        PUBLIC_URL: JSON.stringify(publicUrl),

        // Surface the manifest for use in expo-constants
        APP_MANIFEST: JSON.stringify(getAppManifest()),
      }
    );
  return {
    'process.env': processEnv,
    __DEV__,
  };
}

module.exports = getClientEnvironment();
