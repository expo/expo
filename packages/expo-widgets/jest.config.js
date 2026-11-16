// `bundle` tests are plain Node-targeted TS (hand-written JSX runtime stub, not real JSX), so
// they run on the CLI preset in place of the default `src` projects; `plugin` runs as its own
// project — so a single `jest` invocation covers the whole package.
const { watchPlugins, ...cliPreset } = require('@expo/internal-scripts/jest-preset-cli');
const modulePreset = require('@expo/internal-scripts/jest-preset');

module.exports = require('@expo/internal-scripts/createCompositeJestPreset')(
  __dirname,
  ['plugin'],
  {
    srcProjects: [
      ...modulePreset.projects.map((project) => ({
        ...project,
        rootDir: __dirname,
        roots: ['<rootDir>/src'],
      })),
      {
        ...cliPreset,
        displayName: 'bundle',
        clearMocks: true,
        rootDir: __dirname,
        roots: ['bundle'],
      },
    ],
  }
);
