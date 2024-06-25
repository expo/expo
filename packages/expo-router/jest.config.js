const {
  getWebPreset,
  getNodePreset,
  getIOSPreset,
  getAndroidPreset,
} = require('jest-expo/config/getPlatformPreset');
const { withWatchPlugins } = require('jest-expo/config/withWatchPlugins');
const path = require('path');

function withDefaults({ watchPlugins, ...config }) {
  return {
    ...config,
    roots: ['src'],
    clearMocks: true,
    setupFilesAfterEnv: ['./build/testing-library/mocks.js'],
  };
}

const projects = [
  // Create a new project for each platform.
  getNodePreset(),
  getWebPreset(),
  getIOSPreset(),
  getAndroidPreset(),
].map(withDefaults);

projects.push({
  displayName: { name: 'Type Generation', color: 'blue' },
  testMatch: ['<rootDir>/src/typed-routes/__tests__/*.node.ts'],
  rootDir: path.resolve(__dirname),
  roots: ['src'],
  clearMocks: true,
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
  setupFiles: ['<rootDir>/src/typed-routes/testSetup.ts'],
};

/*
 * In CI, or using `yarn test:tsd` add the TSD project.
 *
 * `jest-runner-tsd` is incompatible with `jest-watch-select-projects` so we need to disable it.
 *
 * If you wish to run only the tsd project, you can use the following command:
 *
 * `yarn test:tsd --selectProjects TSD`
 *
 */
if (process.env.CI || process.env.EXPORT_ROUTER_JEST_TSD) {
  projects.push(tsdProject);
  config.watchPlugins = ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'];
}

module.exports = config;
