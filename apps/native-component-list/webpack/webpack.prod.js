const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BrotliPlugin = require('brotli-webpack-plugin');

const common = require('./webpack.common.js');
const getLocations = require('./webpackLocations');

module.exports = function(env = {}) {
  const locations = getLocations(env.projectRoot);

  const appEntry = [locations.appMain];

  const usePolyfills = env.polyfill !== undefined ? env.polyfill : true;

  if (usePolyfills) {
    appEntry.unshift('@babel/polyfill');
  }

  return merge(common(env), {
    mode: 'production',
    entry: {
      app: appEntry,
    },
    devtool: 'source-map',
    plugins: [
      /** Delete the build folder  */
      new CleanWebpackPlugin([locations.production.folder], {
        root: locations.root,
        verbose: true,
        dry: false,
      }),

      new MiniCssExtractPlugin({
        filename: 'static/css/[contenthash].css',
        chunkFilename: 'static/css/[contenthash].chunk.css',
      }),

      /** GZIP files */
      new CompressionPlugin({
        test: /\.(js|css)$/,
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        threshold: 1024,
        minRatio: 0.8,
      }),
      /** secondary compression for platforms that load .br  */
      new BrotliPlugin({
        asset: '[path].br[query]',
        test: /\.(js|css)$/,
        threshold: 1024,
        minRatio: 0.8,
      }),

      /** Copy the PWA manifest.json and the caching policy serve.json from the template folder to the build folder  */
      new CopyWebpackPlugin([
        {
          from: locations.template.manifest,
          to: locations.production.manifest,
        },
        {
          from: locations.template.serveJson,
          to: locations.production.serveJson,
        },
      ]),
    ],
  });
};
