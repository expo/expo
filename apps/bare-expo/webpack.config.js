const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve.plugins = config.resolve.plugins.filter(({ constructor }) => {
    return !(constructor && constructor.name === 'ModuleScopePlugin');
  });
  return config;
};
