const path = require('path');
const webpack = require('webpack');
const pckg = require('./package.json');

const relativePath = location => path.resolve(__dirname, location);

const locations = {
  // Shouldn't change
  root: relativePath('./'),
  // TODO: Bacon: We should consider how we want to deploy.
  output: relativePath('public/assets'),
  // TODO: Bacon: Only use this in expo/apps/
  modules: relativePath('../../node_modules/'),
};

const environment = process.env.NODE_ENV || 'development';
const __DEV__ = environment !== 'production';

const includeModule = module => {
  return path.resolve(locations.modules, module);
};

const babelLoaderConfiguration = {
  test: /\.jsx?$/,
  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    // TODO: Bacon: This makes compilation take a while
    locations.root,
    locations.modules,
  ],
  use: {
    loader: 'babel-loader',
    options: {
      // cacheDirectory: true,
      babelrc: false,
      /*
       * babel-preset-* is inferred.
       */
      presets: ['babel-preset-expo'],
      plugins: ['babel-plugin-react-native-web', '@babel/plugin-transform-runtime'],
    },
  },
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
    locations.root,
    includeModule('react-native-vector-icons'),
    includeModule('@expo/vector-icons'),
  ],
};

// This is needed for loading css
const cssLoaderConfiguration = {
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
};

function getWebModule(moduleName) {
  return function(res) {
    if (res.context.indexOf('node_modules/react-native') === -1) return;
    res.request = includeModule('react-native-web/dist/exports/' + moduleName);
  };
}

function useWebModules(...modules) {
  return modules.map(
    moduleName =>
      new webpack.NormalModuleReplacementPlugin(new RegExp(moduleName), getWebModule(moduleName))
  );
}

module.exports = {
  entry: path.resolve(locations.root, pckg.main),
  // configures where the build ends up
  output: {
    filename: 'bundle.js',
    publicPath: '/assets/',
    path: locations.output,
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      cssLoaderConfiguration,
      imageLoaderConfiguration,
      ttfLoaderConfiguration,
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(environment),
      __DEV__,
    }),
    ...useWebModules('Platform', 'DeviceInfo', 'Dimensions'),
  ],
  resolve: {
    symlinks: false,
    extensions: ['.web.js', '.js', '.jsx'],
    alias: {
      'react-navigation': '@react-navigation/core',
      'react-native$': 'react-native-web',
    },
  },
};
