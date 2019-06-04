const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const getLocations = require('@expo/webpack-config/webpack/webpackLocations');
const createClientEnvironment = require('@expo/webpack-config/webpack/createClientEnvironment');
const createBabelConfig = require('@expo/webpack-config/webpack/createBabelConfig');

module.exports = function(env) {
  const locations = getLocations(env.projectRoot);
  const babelConfig = createBabelConfig(locations.root);
  // console.log("BABEL", babel)
  //   babelConfig.use.push(require.resolve('ts-loader'));
  // babelConfig.use.push(require.resolve("react-docgen-typescript-loader"));

  const clientEnv = createClientEnvironment(locations);
  const ttfLoaderConfiguration = {
    test: /\.(ttf|otf|woff)$/,
    use: [
      {
        loader: 'url-loader',
        options: {
          limit: 50000,
          name: './fonts/[name].[ext]',
        },
      },
    ],
    include: [
      locations.root,
      locations.includeModule('react-native-vector-icons'),
      locations.includeModule('@expo/vector-icons'),
    ],
  };

  const htmlLoaderConfiguration = {
    test: /\.html$/,
    use: ['html-loader'],
    exclude: locations.template.folder,
  };

  const publicPath = '';

  return {
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
    plugins: [
      // Generate a manifest file which contains a mapping of all asset filenames
      // to their corresponding output file so that tools can pick it up without
      // having to parse `index.html`.
      new ManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath,
      }),
      new webpack.DefinePlugin(clientEnv),
    ],

    module: {
      strictExportPresence: false,

      rules: [
        { parser: { requireEnsure: false } },

        htmlLoaderConfiguration,
        babelConfig,
        // imageLoaderConfiguration,
        ttfLoaderConfiguration,
      ],
    },
    resolve: {
      symlinks: false,
      extensions: [
        '.web.ts',
        '.web.tsx',
        '.ts',
        '.tsx',
        '.web.js',
        '.web.jsx',
        '.js',
        '.jsx',
        '.json',
      ],
      alias: {
        // Alias direct react-native imports to react-native-web
        'react-native$': 'react-native-web',

        '@storybook/react-native$': '@storybook/react',
        // Add polyfills for modules that react-native-web doesn't support
        // Depends on expo-asset
        'react-native/Libraries/Image/AssetSourceResolver$': 'expo-asset/build/AssetSourceResolver',
        'react-native/Libraries/Image/assetPathUtils$': 'expo-asset/build/Image/assetPathUtils',
        'react-native/Libraries/Image/resolveAssetSource$': 'expo-asset/build/resolveAssetSource',
        // Alias internal react-native modules to react-native-web
        'react-native/Libraries/Components/View/ViewStylePropTypes$':
          'react-native-web/dist/exports/View/ViewStylePropTypes',
        'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
          'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
        'react-native/Libraries/vendor/emitter/EventEmitter$':
          'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
        'react-native/Libraries/vendor/emitter/EventSubscriptionVendor$':
          'react-native-web/dist/vendor/react-native/emitter/EventSubscriptionVendor',
        'react-native/Libraries/EventEmitter/NativeEventEmitter$':
          'react-native-web/dist/vendor/react-native/NativeEventEmitter',
      },
    },
  };
};
