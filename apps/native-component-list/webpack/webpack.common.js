const path = require('path');
const webpack = require('webpack');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const env = require('./getClientEnvironment');
const locations = require('./webpackLocations');
const nativeAppManifest = require(locations.appJson);
const indexHTML = require('./getIndexHTMLFromAppJSON');

const includeModule = module => {
  return path.resolve(locations.modules, module);
};

// Only compile files from react-native, and expo libraries.
const includeModulesThatContainPaths = [
  'node_modules/react-native',
  'node_modules/react-navigation',
  'node_modules/expo',
  'node_modules/@react',
  'node_modules/@expo',
];

const babelLoaderConfiguration = {
  test: /\.jsx?$/,
  include(inputPath) {
    for (const option of includeModulesThatContainPaths) {
      if (inputPath.includes(option)) {
        return inputPath;
      }
    }
    // Is inside the project and is not one of designated modules
    if (!inputPath.includes('node_modules') && inputPath.includes(locations.root)) {
      return inputPath;
    }
    return null;
  },
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: false,
      babelrc: false,
    },
  },
};

// This is needed for webpack to import static images in JavaScript files.
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    // loader: 'file-loader',
    options: {
      name: '[name].[ext]',
    },
  },
};

const ttfLoaderConfiguration = {
  test: /\.ttf$/,
  use: [
    {
      loader: 'url-loader',
      // loader: 'file-loader',
      options: {
        name: './fonts/[name].[ext]',
      },
    },
  ],
  include: [
    locations.root,
    includeModule('react-native-vector-icons'),
    includeModule('@expo/vector-icons'),
  ],
};

const htmlLoaderConfiguration = {
  test: /\.html$/,
  use: ['html-loader'],
  include: [locations.absolute('assets')],
};

const mediaLoaderConfiguration = {
  test: /\.(mov|mp4|mp3|wav)$/,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: '[path][name].[ext]',
      },
    },
  ],
};

// This method intercepts modules being referenced in react-native
// and redirects them to web friendly versions in expo.
function getWebModule(initialRoot, moduleName) {
  return function(res) {
    if (res.context.includes('node_modules/react-native/')) {
      res.request = includeModule(initialRoot + moduleName);
    }
  };
}

function useWebModule(modulePathToHiJack, redirectPath, initialRoot = 'expo/build/web/') {
  return new webpack.NormalModuleReplacementPlugin(
    new RegExp(modulePathToHiJack),
    getWebModule(initialRoot, redirectPath)
  );
}

const publicPath = '/';

module.exports = {
  context: __dirname,
  // configures where the build ends up
  output: {
    path: locations.production.folder,
    filename: 'static/[chunkhash].js',
    sourceMapFilename: '[chunkhash].map',
    // There are also additional JS chunk files if you use code splitting.
    chunkFilename: 'static/[id].[chunkhash].js',
    // This is the URL that app is served from. We use "/" in development.
    publicPath,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: false,
    },
    runtimeChunk: 'single',
  },
  plugins: [
    // Generates an `index.html` file with the <script> injected.
    indexHTML,

    new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
      PUBLIC_URL: publicPath,
      WEB_TITLE: nativeAppManifest.expo.name,
    }),

    // Generate a manifest file which contains a mapping of all asset filenames
    // to their corresponding output file so that tools can pick it up without
    // having to parse `index.html`.
    new ManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath,
    }),

    new webpack.DefinePlugin(env),

    useWebModule('Performance/Systrace', 'Performance/Systrace'),
    useWebModule('RCTNetworking', 'Network/RCTNetworking'),
    useWebModule('Platform', 'Utilities/Platform'),
    useWebModule('HMRLoadingView', 'Utilities/HMRLoadingView'),

    new WorkboxPlugin.GenerateSW({
      skipWaiting: true,
      clientsClaim: true,
      exclude: [/\.LICENSE$/, /\.map$/, /asset-manifest\.json$/],
      importWorkboxFrom: 'cdn',
      navigateFallback: `${publicPath}index.html`,
      navigateFallbackBlacklist: [new RegExp('^/_'), new RegExp('/[^/]+\\.[^/]+$')],
      runtimeCaching: [
        {
          urlPattern: /(.*?)/,
          handler: 'staleWhileRevalidate',
        },
      ],
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      // openAnalyzer: false,
    }),
  ],

  module: {
    // strictExportPresence: true,

    rules: [
      { parser: { requireEnsure: false } },

      htmlLoaderConfiguration,
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      ttfLoaderConfiguration,
      mediaLoaderConfiguration,
    ],
  },
  resolve: {
    symlinks: false,
    extensions: ['.web.js', '.js', '.jsx', '.json'],
    alias: {
      /* Alias direct react-native imports to react-native-web */
      'react-native$': 'react-native-web',
    },
  },
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
  },
  // Turn off performance processing because we utilize
  // our own hints via the FileSizeReporter
  performance: false,
};
