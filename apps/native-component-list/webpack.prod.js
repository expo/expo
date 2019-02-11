const merge = require('webpack-merge');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const common = require('./webpack.common.js');
const locations = require('./webpackLocations');
const nativeAppManifest = require(path.resolve(__dirname, './app.json'));
const { productionPath = 'web-build' } = nativeAppManifest.expo.web;

module.exports = merge(common, {
  // devtool: 'cheap-module-source-map',
  entry: locations.appMain,
  plugins: [new CleanWebpackPlugin([productionPath])],
});
