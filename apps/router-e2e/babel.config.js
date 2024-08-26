module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
