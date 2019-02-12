const merge = require('webpack-merge');
const webpack = require('webpack');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const common = require('./webpack.common.js');
const locations = require('./webpackLocations');

module.exports = merge(common, {
  mode: 'development',
  entry: [require.resolve('react-dev-utils/webpackHotDevClient'), locations.appMain],
  devtool: 'cheap-module-source-map',
  devServer: {
    progress: true,
    historyApiFallback: true,
    compress: true,
    disableHostCheck: true,
    contentBase: locations.contentBase,
    inline: true,
  },
  resolve: {
    plugins: [
      // Adds support for installing with Plug'n'Play, leading to faster installs and adding
      // guards against forgotten dependencies and such.
      PnpWebpackPlugin,
      // Prevents users from importing files from outside of node_modules/.
      // This often causes confusion because we only process files within the root folder with babel.
      // To fix this, we prevent you from importing files out of the root folder -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.
      new ModuleScopePlugin(locations.contentBase, [locations.packageJson]),
    ],
  },
  resolveLoader: {
    plugins: [
      // Also related to Plug'n'Play, but this time it tells Webpack to load its loaders
      // from the current package.
      PnpWebpackPlugin.moduleLoader(module),
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new CaseSensitivePathsPlugin(),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
  // Turn off performance processing because we utilize
  // our own hints via the FileSizeReporter
  performance: false,
});
