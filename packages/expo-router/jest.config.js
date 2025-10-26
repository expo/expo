const {
  getWebPreset,
  getNodePreset,
  getIOSPreset,
  getAndroidPreset,
} = require('jest-expo/config/getPlatformPreset');
const { withWatchPlugins } = require('jest-expo/config/withWatchPlugins');

function withDefaults({ watchPlugins, ...config }) {
  return {
    ...config,
    roots: ['src'],
    clearMocks: true,
    setupFilesAfterEnv: ['./build/testing-library/mocks.js'],
    // Map CSS modules to a proxy object so Jest doesn't attempt to parse them.
    moduleNameMapper: {
      // Existing mappings (if any) should come first so users can override if needed.
      ...(config.moduleNameMapper || {}),
      // CSS Modules: treat class names as keys for predictable snapshots.
      '^.+\\.module\\.css$': '<rootDir>/__mocks__/styleMock.js',
      // Plain CSS (and other style files) can be stubbed with an empty object.
      '^.+\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    },
  };
}

const projects = [
  // Create a new project for each platform.
  getNodePreset(),
  getWebPreset(),
  getIOSPreset(),
  getAndroidPreset(),
].map(withDefaults);

const config = withWatchPlugins({
  projects,
});

module.exports = config;
