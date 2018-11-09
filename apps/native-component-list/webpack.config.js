const path = require('path');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname, './');

const moduleDirectory = path.resolve(__dirname, '../../');

// This is needed for webpack to compile JavaScript.
// Many OSS React Native packages are not compiled to ES5 before being
// published. If you depend on uncompiled packages they may cause webpack build
// errors. To fix this webpack can be configured to compile to the necessary
// `node_module`.
const babelLoaderConfiguration = {
  test: /\.js$/,
  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    path.resolve(appDirectory, 'src/index.js'),
    path.resolve(appDirectory, 'src'),
    path.resolve(moduleDirectory, 'node_modules/react-native-uncompiled'),
    path.resolve(moduleDirectory, 'node_modules/react-navigation'),
    path.resolve(moduleDirectory, 'node_modules/react-native-tab-view'),
    path.resolve(moduleDirectory, 'node_modules/react-native-vector-icons'),
    path.resolve(moduleDirectory, 'node_modules/react-native-safe-area-view'),
    path.resolve(moduleDirectory, 'node_modules/@expo/samples'),
    path.resolve(moduleDirectory, 'node_modules/@expo/vector-icons'),
    path.resolve(moduleDirectory, 'node_modules/react-native-platform-touchable'),

    path.resolve(moduleDirectory, 'node_modules/expo-constants'),
    path.resolve(moduleDirectory, 'node_modules/expo-asset'),
    path.resolve(moduleDirectory, 'node_modules/expo-font'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      // cacheDirectory: true,
      babelrc: false,
      presets: ['module:metro-react-native-babel-preset'],

      plugins: [
        'react-native-web',
        'transform-class-properties',
        'transform-react-jsx',
        // 'transform-object-rest-spread',
        'transform-flow-strip-types',
        [
          '@babel/transform-runtime',
          {
            helpers: false,
            regenerator: true,
            // corejs: 2,
            // useESModules: false,
          },
        ],
      ],
    },
  },
};

// This is needed for loading css
const cssLoaderConfiguration = {
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
};

// This is needed for webpack to import static images in JavaScript files.
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
    },
  },
};

const ttfLoaderConfiguration = {
  test: /\.ttf$/,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: './fonts/[hash].[ext]',
      },
    },
  ],
  include: [
    path.resolve(appDirectory, './src/assets/fonts'),
    path.resolve(moduleDirectory, 'node_modules/react-native-vector-icons'),
  ],
};

module.exports = {
  entry: [
    // load any web API polyfills
    // path.resolve(appDirectory, 'polyfills-web.js'),
    // your web-specific entry file
    path.resolve(appDirectory, 'src/index.js'),
  ],

  // configures where the build ends up
  output: {
    filename: 'bundle.js',
    publicPath: '/assets/',
    path: path.resolve(appDirectory, './public/assets'),
  },

  // ...the rest of your config

  module: {
    rules: [
      babelLoaderConfiguration,
      cssLoaderConfiguration,
      imageLoaderConfiguration,
      ttfLoaderConfiguration,
    ],
  },

  plugins: [
    // process.env.NODE_ENV === 'production' must be true for production
    // builds to eliminate development checks and reduce build size. You may
    // wish to include additional optimizations.
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      __DEV__: process.env.NODE_ENV === 'production' || true,
    }),
  ],

  resolve: {
    // If you're working on a multi-platform React Native app, web-specific
    // module implementations should be written in files using the extension
    // '.web.js'.
    symlinks: false,
    extensions: ['.web.js', '.js'],
    alias: {
      './assets/images/expo-icon.png': './assets/images/expo-icon@2x.png',
      './assets/images/slack-icon.png': './assets/images/slack-icon@2x.png',
      'react-native': 'react-native-web',
    },
  },
};
