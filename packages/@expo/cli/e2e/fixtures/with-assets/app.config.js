/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  assetBundlePatterns: ['assets/*.ttf'],
  android: {
    package: 'com.example.minimal',
  },
  ios: {
    bundleIdentifier: 'com.example.minimal',
  },
  web: {
    bundler: 'metro',
  },
  experiments: {
    tsconfigPaths:
      '_EXPO_E2E_USE_PATH_ALIASES' in process.env
        ? Boolean(process.env._EXPO_E2E_USE_PATH_ALIASES)
        : true,
  },
};
