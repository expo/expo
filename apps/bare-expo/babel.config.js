module.exports = function (api) {
  api.cache(true);

  const moduleResolverConfig = {
    alias: {},
  };

  // We'd like to get rid of `native-component-list` being a part of the final bundle.
  // Otherwise, some tests may fail due to timeouts (bundling takes significantly more time).
  if (process.env.CI || process.env.NO_NCL) {
    moduleResolverConfig.alias['^native-component-list(/.*)?'] = require.resolve(
      './moduleResolvers/nullResolver.js'
    );
  }

  return {
    // [Custom] Needed for decorators
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-proposal-export-namespace-from',
      'react-native-reanimated/plugin',
      ['babel-plugin-module-resolver', moduleResolverConfig],
    ],
  };
};
