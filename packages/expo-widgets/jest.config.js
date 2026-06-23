// The widget bundle is plain Node-targeted TS (the JSX runtime is a hand-written
// stub, not real JSX syntax), and its tests live under `bundle/__tests__` rather
// than `src`. Use the SWC-based CLI preset (Node env, type-stripping transform)
// and point `roots` at `bundle` so the test suite is discovered and transpiled.
/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  clearMocks: true,
  displayName: require('./package').name,
  rootDir: __dirname,
  roots: ['bundle'],
};
