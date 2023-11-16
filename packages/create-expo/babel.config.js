module.exports = function (api) {
  api.cache(true);
  return {
    // Only use this when running tests
    env: {
      test: {
        // This preset is a dependency of `expo-module-scripts`
        presets: ['babel-preset-expo'],
      },
    },
  };
};
