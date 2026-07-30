// `bundle` tests are plain Node-targeted TS (hand-written JSX runtime stub, not real JSX), so
// they run on the CLI preset in place of the default `src` projects; `plugin` runs as its own
// project — so a single `jest` invocation covers the whole package.
const { watchPlugins, prettierPath, ...cliPreset } = require('expo-module-scripts/jest-preset-cli');

module.exports = require('expo-module-scripts/createCompositeJestPreset')(__dirname, ['plugin'], {
  srcProjects: [
    {
      ...cliPreset,
      displayName: 'bundle',
      clearMocks: true,
      rootDir: __dirname,
      roots: ['bundle'],
    },
  ],
});
