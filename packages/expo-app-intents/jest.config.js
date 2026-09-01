// The config plugin and CLI have tests outside the module preset's `src` root. Running each as its
// own project means one `jest` invocation covers the whole package in the appropriate environment.
module.exports = require('expo-module-scripts/createCompositeJestPreset')(__dirname, [
  'plugin',
  'cli',
]);
