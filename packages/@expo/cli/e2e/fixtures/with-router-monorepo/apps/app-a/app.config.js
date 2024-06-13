/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  scheme: 'acme',
  android: {
    package: 'com.example.minimal.appa',
  },
  ios: {
    bundleIdentifier: 'com.example.minimal.appa',
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  experiments: {
    typedRoutes: process.env._EXPO_E2E_USE_TYPED_ROUTES ? true : undefined,
  },
};
