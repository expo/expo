// `src` tests are iOS-only (iOS snapshots), so keep that platform set; `plugin` runs as its
// own project — so a single `jest` invocation covers the whole package.
module.exports = require('expo-module-scripts/createCompositeJestPreset')(__dirname, ['plugin'], {
  srcProjects: [{ preset: 'jest-expo/ios' }],
});
