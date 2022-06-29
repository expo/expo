const createConfigAsync = require('@expo/webpack-config');

module.exports = async (env) => {
  const config = await createConfigAsync(env);
  // allow reloading when the packages are updated.
  if (config.devServer) {
    delete config.devServer.watchOptions;
  }

  config.resolve.alias = {
    ...config.resolve.alias,

    // Workaround bundle error where reanimated tries to import internal module,
    // alias ReactFabric to an ordinary module in react-native-web.
    'react-native/Libraries/Renderer/shims/ReactFabric': 'react-native-web/dist/cjs/exports/render',
  };

  return config;
};
