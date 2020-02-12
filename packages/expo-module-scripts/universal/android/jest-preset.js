try {
  const createJestPreset = require('../../createJestPreset');
  module.exports = createJestPreset(require('jest-expo/android/jest-preset'));
} catch (error) {
  console.error(error);
  process.exit(1);
}
