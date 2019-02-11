const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const common = require('./webpack.common.js');
const locations = require('./webpackLocations');

module.exports = merge(common, {
  mode: 'production',
  entry: locations.appMain,
  devtool: 'cheap-module-source-map',
  plugins: [new CleanWebpackPlugin([locations.production])],
});
