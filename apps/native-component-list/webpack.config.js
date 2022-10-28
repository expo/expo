const createConfigAsync = require('@expo/webpack-config');

module.exports = async (env, argv) => {
  const config = await createConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@shopify/react-native-skia'],
      },
    },
    argv
  );
  // allow reloading when the packages are updated.
  if (config.devServer) {
    delete config.devServer.watchOptions;
  }
  return config;
};
