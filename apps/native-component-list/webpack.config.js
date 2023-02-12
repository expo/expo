const createConfigAsync = require('@expo/webpack-config');

module.exports = async (env, argv) => {
  const config = await createConfigAsync(env, argv);
  // allow reloading when the packages are updated.
  if (config.devServer) {
    delete config.devServer.watchOptions;
  }
  return config;
};
