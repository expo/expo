const createJestPreset = require('expo-module-scripts/createJestPreset');
const { withWatchPlugins } = require('jest-expo/config');

function withMore(config) {
  return {
    ...config,
    clearMocks: true,
    transformIgnorePatterns: [
      // ...config.transformIgnorePatterns,
      'node_modules/(?!@react-native|react-native)',
    ],
  };
}

module.exports = withWatchPlugins({
  projects: [
    createJestPreset(withMore(require('jest-expo/ios/jest-preset'))),
    createJestPreset(withMore(require('jest-expo/android/jest-preset'))),
    createJestPreset(withMore(require('jest-expo/web/jest-preset'))),
  ],
});
