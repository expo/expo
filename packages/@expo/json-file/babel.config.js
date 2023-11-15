module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['@expo/babel-preset-cli'],
  };
};
