const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BrotliPlugin = require('brotli-webpack-plugin');
const WebpackDeepScopeAnalysisPlugin = require('webpack-deep-scope-plugin').default;

const common = require('./webpack.common.js');
const getLocations = require('./webpackLocations');

module.exports = function(env = {}) {
  const locations = getLocations(env.projectRoot);

  const appEntry = [locations.appMain];

  const usePolyfills = true;

  if (usePolyfills) {
    appEntry.unshift('@babel/polyfill');
  }

  return merge(common(env), {
    mode: 'production',
    entry: {
      vendor: ['react', 'react-native-web'],
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
      /** Remove unused import/exports  */
      new WebpackDeepScopeAnalysisPlugin(),

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
    optimization: {
      usedExports: true,
      concatenateModules: true,
      occurrenceOrder: true,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          cache: true,
          sourceMap: true,
          parallel: true,
          extractComments: 'all',
          terserOptions: {
            warnings: false,
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
            module: false,
            toplevel: false,
            nameCache: null,
            ie8: false,
            keep_classnames: undefined,
            keep_fnames: false,
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        maxAsyncRequests: 5,
        minSize: 0,
        maxSize: 0,
        minChunks: Infinity,
        automaticNameDelimiter: '~',
        name: true,
        cacheGroups: {
          vendor: {
            chunks: 'all',
            priority: -10,
            test: /[\\/]node_modules[\\/]/,
            // name of the chunk
            name(module) {
              // get the name. E.g. node_modules/packageName/not/this/part.js
              // or node_modules/packageName
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

              // npm package names are URL-safe, but some servers don't like @ symbols
              return `npm.${packageName.replace('@', '')}`;
            },
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            chunks: 'initial',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    },
  });
};
