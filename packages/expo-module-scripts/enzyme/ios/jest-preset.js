try {
  const { withEnzyme } = require('jest-expo-enzyme');
  const withExpoModuleScripts = require('../../createJestPreset');

  module.exports = withExpoModuleScripts(withEnzyme(require('jest-expo/ios/jest-preset')));
} catch (error) {
  console.error(error);
  process.exit(1);
}
