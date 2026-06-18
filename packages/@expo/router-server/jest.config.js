const createJestPreset = require('expo-module-scripts/createJestPreset');
const { getWebPreset, getNodePreset } = require('jest-expo/config/getPlatformPreset');
const { withWatchPlugins } = require('jest-expo/config/withWatchPlugins');
const path = require('node:path');

function withDefaults({ watchPlugins, ...config }) {
  return {
    ...config,
    roots: ['src'],
    clearMocks: true,
  };
}

const projects = [
  // Create a new project for each platform needed
  getNodePreset(),
  getWebPreset(),
]
  .map(createJestPreset)
  .map(withDefaults);

// Reuse the node preset's transform so TypeScript files in the hand-rolled
// projects below are transpiled (they would otherwise fail to parse TS syntax).
const { transform } = createJestPreset(getNodePreset());

projects.push({
  displayName: { name: 'Type Generation', color: 'blue' },
  testMatch: ['<rootDir>/src/typed-routes/__tests__/*.node.ts'],
  rootDir: path.resolve(__dirname),
  roots: ['src'],
  clearMocks: true,
  transform,
  setupFiles: ['<rootDir>/src/typed-routes/testSetup.ts'],
});

const config = withWatchPlugins({
  projects,
});

const tsdProject = {
  displayName: { name: 'TSD', color: 'blue' },
  runner: 'jest-runner-tsd',
  testMatch: ['<rootDir>/src/typed-routes/__tests__/*.tsd.ts'],
  rootDir: path.resolve(__dirname),
  roots: ['src'],
  transform,
  setupFiles: ['<rootDir>/src/typed-routes/testSetup.ts'],
};

/*
 * In CI, or using `pnpm test:tsd` add the TSD project.
 *
 * `jest-runner-tsd` is incompatible with `jest-watch-select-projects` so we need to disable it.
 *
 * If you wish to run only the tsd project, you can use the following command:
 *
 * `pnpm test:tsd --selectProjects TSD`
 *
 */
if (process.env.CI || process.env.EXPORT_ROUTER_JEST_TSD) {
  projects.push(tsdProject);
  config.watchPlugins = ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'];
}

module.exports = config;
