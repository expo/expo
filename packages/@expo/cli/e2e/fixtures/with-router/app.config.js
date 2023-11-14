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
    bundler: 'metro',
  },
  experiments: {
    typedRoutes: process.env._EXPO_E2E_USE_TYPED_ROUTES ? true : undefined,
  },
};
