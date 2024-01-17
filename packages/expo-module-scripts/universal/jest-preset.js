const { withWatchPlugins } = require('jest-expo/config');

const createJestPreset = require('../createJestPreset');

console.warn(
  'The Jest preset "expo-module-scripts/universal" is deprecated; please use the alias "expo-module-scripts" instead'
);
module.exports = withWatchPlugins({
  projects: [
    createJestPreset(require('jest-expo/ios/jest-preset')),
    createJestPreset(require('jest-expo/android/jest-preset')),
    createJestPreset(require('jest-expo/web/jest-preset')),
    createJestPreset(require('jest-expo/node/jest-preset')),
  ],
});
