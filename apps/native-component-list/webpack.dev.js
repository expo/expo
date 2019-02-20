const merge = require('webpack-merge');
const webpack = require('webpack');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const PnpWebpackPlugin = require('pnp-webpack-plugin');

const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');

const common = require('./webpack.common.js');
const locations = require('./webpackLocations');

module.exports = merge(common, {
  mode: 'development',
  entry: [require.resolve('react-dev-utils/webpackHotDevClient'), locations.appMain],
  output: {
    path: locations.absolute('web-build'),
    filename: 'static/bundle.js',
    // There are also additional JS chunk files if you use code splitting.
    chunkFilename: 'static/[name].chunk.js',
    // This is the URL that app is served from. We use "/" in development.
    publicPath: '/',
    crossOriginLoading: 'anonymous',
  },
  devtool: 'cheap-module-source-map',
  devServer: {
    stats: {
      colors: true,
    },
    progress: true,
    historyApiFallback: {
      disableDotRule: true,
    },
    compress: true,
    disableHostCheck: true,
    contentBase: locations.contentBase,
    inline: true,
    clientLogLevel: 'none',
    overlay: false,
    host: 'localhost',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    before(app) {
      // This lets us open files from the runtime error overlay.
      app.use(errorOverlayMiddleware());
      // This service worker file is effectively a 'no-op' that will reset any
      // previous service worker registered for the same host:port combination.
      // We do this in development to avoid hitting the production cache if
      // it used the same host and port.
      // https://github.com/facebookincubator/create-react-app/issues/2272#issuecomment-302832432
      app.use(noopServiceWorkerMiddleware());
    },
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
  ],
  // Turn off performance processing because we utilize
  // our own hints via the FileSizeReporter
  performance: false,
});
