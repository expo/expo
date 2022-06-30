const createConfigAsync = require('@expo/webpack-config');

module.exports = async (env) => {
  const config = await createConfigAsync(env);
  // allow reloading when the packages are updated.
  if (config.devServer) {
    delete config.devServer.watchOptions;
  }
  return config;
};
