module.exports = function(api) {
  api.cache(true);
  return {
    // Only use this for the `tests/` folder.
    env: {
      test: {
        presets: ['babel-preset-expo'],
      },
    },
  };
};
