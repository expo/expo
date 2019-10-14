try {
  const { withEnzyme } = require('jest-expo-enzyme');
  const { withWatchPlugins } = require('jest-expo/config');
  const withExpoModuleScripts = require('../createJestPreset');

  module.exports = withWatchPlugins({
    projects: [
      require('jest-expo/ios/jest-preset'),
      require('jest-expo/android/jest-preset'),
      require('jest-expo/web/jest-preset'),
    ].map(preset => withExpoModuleScripts(withEnzyme(preset))),
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
