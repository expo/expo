const { getWebPreset, getNodePreset } = require('jest-expo/config/getPlatformPreset');
const { withWatchPlugins } = require('jest-expo/config/withWatchPlugins');

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
].map(withDefaults);

const config = withWatchPlugins({
  projects,
});

module.exports = config;
