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
    // This fixture uses registerRootComponent rather than Expo Router.
    output: 'single',
  },
  experiments: {
    autolinkingModuleResolution: true,
  },
};
