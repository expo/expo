const { withWatchPlugins } = require('jest-expo/config');
const createJestPreset = require('../createJestPreset');

console.warn(
  'The Jest preset "expo-module-scripts/ios" is deprecated, please convert your tests to universal tests and use "expo-module-scripts" instead'
);
module.exports = withWatchPlugins(createJestPreset(require('jest-expo/ios/jest-preset')));
