// you can use this file to add your custom webpack plugins, loaders and anything you like.
// This is just the basic way to add additional webpack configurations.
// For more information refer the docs: https://storybook.js.org/configurations/custom-webpack-config

// IMPORTANT
// When you add this file, we won't add the default configurations which is similar
// to "React Create App". This only has babel loader to load JavaScript.

const path = require('path');
const webpackConfig = require('@expo/webpack-config/webpack/webpack.common');
const merge = require('webpack-merge');

module.exports = function({ mode, config }, argv) {
  const expoConfig = webpackConfig(
    { [config.mode]: true, projectRoot: path.resolve(__dirname, '../') },
    argv
  );

  return merge(expoConfig, config);
};
