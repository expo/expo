const createJestPreset = require('expo-module-scripts/createJestPreset');

module.exports = {
  projects: [
    createJestPreset(require('jest-expo/ios/jest-preset')),
    createJestPreset(require('jest-expo/android/jest-preset')),
  ].map(({ watchPlugins, passWithNoTests, ...project }) => project),
};
