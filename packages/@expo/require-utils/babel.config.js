// ensure dynamic import are not transformed for require-utils
// this is required to dynamically load ESM modules using `await import()`
// fix on main https://github.com/expo/expo/pull/47170
module.exports = function (api) {
  const config = require('expo-module-scripts/babel.config.cli')(api);
  config.plugins = config.plugins.filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== 'babel-plugin-dynamic-import-node';
  });
  return config;
};
