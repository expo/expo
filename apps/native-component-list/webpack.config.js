const path = require('path');
const webpack = require('webpack');
const pckg = require('./package.json');
const appDirectory = path.resolve(__dirname, './');

const moduleDirectory = path.resolve(__dirname, '../../node_modules/');
const includeModule = module => path.resolve(moduleDirectory, module);

const expoPckg = require(`${includeModule('expo')}/package.json`);
const expoDeps = Object.keys(expoPckg.dependencies)
  .filter(moduleName => moduleName.includes('expo'))
  .map(includeModule);

// This is needed for webpack to compile JavaScript.
// Many OSS React Native packages are not compiled to ES5 before being
// published. If you depend on uncompiled packages they may cause webpack build
// errors. To fix this webpack can be configured to compile to the necessary
// `node_module`.

const babelLoaderConfiguration = {
  test: /\.js$/,

  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    /// Project
    // TODO: Bacon: This makes compilation take a while
    path.resolve(appDirectory, '.'),
    // path.resolve(appDirectory, 'src/index.js'),
    // path.resolve(appDirectory, 'node_modules/expo'),

    ...expoDeps,

    /// React Native
    includeModule('react-native-uncompiled'),
    includeModule('react-native-tab-view'),
    includeModule('react-native-vector-icons'),
    includeModule('react-native-safe-area-view'),
    includeModule('react-native-platform-touchable'),

    /// React Navigation
    includeModule('react-navigation'),
    includeModule('react-navigation-stack'),
    includeModule('@react-navigation'),
    includeModule('react-native-gesture-handler'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      // cacheDirectory: true,
      babelrc: false,
      /*
       * babel-preset-* is inferred.
       */
      presets: ['expo'],
      plugins: ['react-native-web', '@babel/transform-runtime'],
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
    path.resolve(appDirectory, './assets/fonts'),
    includeModule('react-native-vector-icons'),
  ],
};

module.exports = {
  entry: [
    // load any web API polyfills
    // path.resolve(appDirectory, 'polyfills-web.js'),
    // your web-specific entry file
    path.resolve(appDirectory, pckg.main),
  ],

  // configures where the build ends up
  output: {
    filename: 'bundle.js',
    publicPath: '/assets/',
    path: path.resolve(appDirectory, 'public/assets'),
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
      'react-navigation': '@react-navigation/core',
    },
  },
};
