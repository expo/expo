/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  android: {
    package: 'com.example.minimal',
  },
  ios: {
    bundleIdentifier: 'com.example.minimal',
  },
  experiments: {
    tsconfigPaths: process.env._EXPO_E2E_USE_PATH_ALIASES ? true : undefined,
  },
};
