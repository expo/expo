const createJestPreset = require('../createJestPreset.cjs');

console.warn(
  'The Jest preset "@expo/internal-scripts/ios" is deprecated, please convert your tests to universal tests and use "@expo/internal-scripts" instead'
);
module.exports = createJestPreset(require('jest-expo/ios/jest-preset'));
