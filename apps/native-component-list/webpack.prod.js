const merge = require('webpack-merge');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const common = require('./webpack.config.js');
const locations = require('./webpackLocations');
const nativeAppManifest = require(path.resolve(__dirname, './app.json'));
const { productionPath = 'web-build' } = nativeAppManifest.expo.web;

module.exports = merge(common, {
  entry: locations.appMain,
  devtool: 'cheap-module-source-map',
  plugins: [new CleanWebpackPlugin([productionPath])],
});
