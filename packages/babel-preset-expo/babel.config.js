module.exports = function (api) {
  api.cache(true);
  return {
    // Only transpile our source code
    include(filename) {
      // Ignore tests and the `unknown` name used in tests
      return !filename.match(/samples/) && filename.match(/src\/(.*)\.tsx?/);
    },
    presets: ['expo-module-scripts/babel.config.cli'],
  };
};
