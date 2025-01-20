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
    output: process.env.E2E_USE_STATIC ?? 'single',
  },
  experiments: {
    typedRoutes: process.env._EXPO_E2E_USE_TYPED_ROUTES ? true : undefined,
  },
};
