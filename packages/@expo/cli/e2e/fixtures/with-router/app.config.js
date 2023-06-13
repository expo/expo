/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  scheme: 'acme',
  android: {
    package: 'com.example.minimal',
  },
  ios: {
    bundleIdentifier: 'com.example.minimal',
  },
  web: {
    output: process.env.EXPO_WEB_OUTPUT_MODE,
    bundler: 'metro',
  },
  experiments: {
    tsconfigPaths: process.env._EXPO_E2E_USE_PATH_ALIASES ? true : undefined,
  },
};
