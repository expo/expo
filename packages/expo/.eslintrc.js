// Specify parserOptions.babelOptions.configFile until we remove custom Babel configurations for
// this package
module.exports = {
  extends: require.resolve('expo-module-scripts/eslintrc.base.js'),
  parserOptions: {
    babelOptions: {
      configFile: './babel.config.build.js',
    },
  },
};
