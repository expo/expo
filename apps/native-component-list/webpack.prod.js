const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const common = require('./webpack.common.js');
const locations = require('./webpackLocations');
const WorkboxPlugin = require('workbox-webpack-plugin');
const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// const safePostCssParser = require('postcss-safe-parser');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: 'production',
  // entry: locations.appMain,
  entry: {
    vendor: ['react', 'react-native-web'],
    app: ['babel-polyfill', locations.appMain],
  },
  output: {
    filename: 'static/[name].[chunkhash].js',
    sourceMapFilename: '[name].[chunkhash].map',
    chunkFilename: 'static/[id].[chunkhash].js'  
  },
  devtool: 'hidden-source-map',
  plugins: [
    new CleanWebpackPlugin([locations.production]),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new CopyWebpackPlugin([
      {
        from: locations.absolute('./web/manifest.json'),
        to:  locations.absolute('./web-build/manifest.json'),
      },
      {
        from: locations.absolute('./web/serve.json'),
        to:  locations.absolute('./web-build/serve.json'),
      },
    ]),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash].css',
      chunkFilename: 'static/css/[name].[contenthash].chunk.css',
    }),

    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new CompressionPlugin({
      test: /\.(js|css)$/,
      filename: '[path].gz[query]',
      algorithm: 'gzip',
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),

  ],
  module: {
    rules: [
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: require.resolve('url-loader'),
        options: {
          limit: 10000,
          name: 'static/media/[name].[hash].[ext]',
        },
      },
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      // we specify a custom TerserPlugin here to get source maps in production
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
          // module: false,
          // toplevel: false,
          // nameCache: null,
          // ie8: false,
          // keep_classnames: undefined,
          // keep_fnames: false,
        },
      }),
      // new OptimizeCSSAssetsPlugin({
      //   cssProcessorOptions: {
      //     parser: safePostCssParser,
      //     map: 
      //       {
      //         inline: false,
      //         annotation: true,
      //       }
      //   },
      // }),
    ],
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      maxSize: 0,
      minChunks: Infinity,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        },
        commons: {
          minChunks: 2,
          minSize: 0, //30000,
          chunks: 'initial',
          name: 'commons',
        }
      }
    }
  },
});
