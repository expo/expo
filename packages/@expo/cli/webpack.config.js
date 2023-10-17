const path = require('path');
const webpack = require('webpack');
const { getBareExtensions } = require('@expo/config/paths');

const {
  /** Enable the bundle analyzer to validate the output after updating */
  WEBPACK_ANALYZE,
  /** Enable production mode to output the most optimized bundle */
  WEBPACK_PRODUCTION,
  LIBRARY,
} = process.env;

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'development',
  entry: {
    index: path.resolve(__dirname, './native-polyfills/src/standalone.js'),
  },

  output: {
    path: path.resolve(__dirname, 'native-polyfills/build'),
    filename: 'index.js',
    // library: '[name]', // This causes a weird export
    libraryTarget: 'umd',
    clean: true,
    globalObject: 'this',
  },
  plugins: [],
  module: {
    rules: [
      {
        // Image loading
        test: /\.(gif|jpe?g|png|svg)$/u,
        use: {
          loader: 'file-loader',
        },
      },
      {
        test: /\.(ts|js|mjs|jsx|tsx)$/u,
        exclude: [path.resolve(__dirname, 'node_modules')],

        use: {
          loader: 'babel-loader',
          options: {
            // Prevent adding _interopRequireDefault if the file is already an ES module
            sourceType: 'unambiguous',
            caller: {
              platform: 'ios',
              bundler: 'webpack',
            },
            configFile: false,
            babelrc: false,

            // plugins: [
            //   [require("@babel/plugin-transform-block-scoping")],
            // ],
            presets: [
              // "@babel/preset-typescript",
              [
                'babel-preset-expo',
                {
                  web: {
                    withDevTools: false,
                    // disableImportExportTransform: false,
                    unstable_transformProfile: 'hermes-stable',
                  },
                  native: {
                    withDevTools: false,
                    // disableImportExportTransform: false,
                    unstable_transformProfile: 'hermes-stable',
                  },
                },
              ],
            ],
          },
        },
      },
    ],
  },
  resolve: {
    alias: {},
    extensions: getBareExtensions(['ios', 'native'], {
      isModern: true,
      isReact: true,
      isTS: true,
    }).map((f) => '.' + f),
    mainFields: ['react-native', 'browser', 'main'],
  },
};

config.externals = [
  ({ context, request }, callback) => {
    return callback();
  },
];
// We want to optimize the bundle output to minimize the size of the bundle
if (WEBPACK_PRODUCTION) {
  config.mode = 'production';
  // config.devtool = "inline-source-map";
  config.optimization = {
    minimize: true,
  };
}

module.exports = config;
