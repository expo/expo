const path = require('path');
const webpack = require('webpack');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const pckg = require('./package.json');

const absolutePath = location => path.resolve(__dirname, location);

const locations = {
  // Shouldn't change
  root: absolutePath('.'),
  output: absolutePath('web'),
  rootHtml: absolutePath('web/index.html'),
  packageJson: absolutePath('package.json'),
  appMain: absolutePath(pckg.main),

  // TODO: Bacon: Only use this in expo/apps/
  modules: absolutePath('../../node_modules'),
};

const environment = process.env.NODE_ENV || 'development';
const __DEV__ = environment !== 'production';

const REACT_APP = /^REACT_APP_/i;

const publicUrl = '';

function getClientEnvironment(publicUrl) {
  let processEnv = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = JSON.stringify(process.env[key]);
        return env;
      },
      {
        // Useful for determining whether we’re running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),

        // Useful for resolving the correct path to static assets in `public`.
        // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
        // This should only be used as an escape hatch. Normally you would put
        // images into the `src` and `import` them in code to get their paths.
        PUBLIC_URL: JSON.stringify(publicUrl),
      }
    );
  return {
    'process.env': processEnv,
    __DEV__,
  };
}

const env = getClientEnvironment(publicUrl);

const includeModule = module => {
  return path.resolve(locations.modules, module);
};

const babelLoaderConfiguration = {
  test: /\.jsx?$/,
  include: [
    // TODO: Bacon: This makes compilation take a while
    locations.root,
    locations.modules,
  ],
  use: {
    loader: 'babel-loader',
    options: {
      babelrc: false,
    },
  },
};

// This is needed for webpack to import static images in JavaScript files.
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: {
      limit: 10000,
      name: '[name].[ext]',
    },
  },
};

// This is needed for loading css
const cssLoaderConfiguration = {
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
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

const htmlLoaderConfiguration = {
  test: /\.html$/,
  use: ['html-loader'],
  include: [absolutePath('./assets')],
};

const videoLoaderConfiguration = {
  test: /\.(mov|mp4)$/,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: '[path][name].[ext]',
      },
    },
  ],
};

function getWebModule(moduleName, initialRoot, logTag) {
  return function(res) {
    if (res.context.indexOf('node_modules/react-native/') === -1) return;
    res.request = includeModule(initialRoot + moduleName);
  };
}

function useWebModules(modules, initialRoot = 'react-native-web/dist/exports/', logTag) {
  return modules.map(module => {
    let moduleName = module;
    let proxyName = module;
    if (Array.isArray(module)) {
      moduleName = module[0];
      proxyName = module[1];
    }
    return new webpack.NormalModuleReplacementPlugin(
      new RegExp(moduleName),
      getWebModule(proxyName, initialRoot, logTag)
    );
  });
}

const publicPath = '/';

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',

  entry: [require.resolve('react-dev-utils/webpackHotDevClient'), locations.appMain],
  // configures where the build ends up
  output: {
    path: locations.output,
    pathinfo: true,
    filename: 'bundle.js',
    // There are also additional JS chunk files if you use code splitting.
    chunkFilename: '[name].chunk.js',
    // This is the URL that app is served from. We use "/" in development.
    publicPath,
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
  },
  optimization: {
    runtimeChunk: true,
  },
  devServer: {
    historyApiFallback: true,
    compress: true,
  },
  module: {
    rules: [
      { parser: { requireEnsure: false } },

      htmlLoaderConfiguration,
      babelLoaderConfiguration,
      cssLoaderConfiguration,
      imageLoaderConfiguration,
      ttfLoaderConfiguration,
      videoLoaderConfiguration,
    ],
  },
  plugins: [
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin({
      inject: true,
      template: locations.rootHtml,
      filename: locations.rootHtml,
      title: pckg.name,
    }),
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
      PUBLIC_URL: publicUrl,
    }),

    new webpack.HotModuleReplacementPlugin(),

    new CaseSensitivePathsPlugin(),

    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    /* expo-localization uses `moment/timezone` */
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // Generate a manifest file which contains a mapping of all asset filenames
    // to their corresponding output file so that tools can pick it up without
    // having to parse `index.html`.
    new ManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath,
    }),

    new webpack.DefinePlugin(env),
    ...useWebModules(['Platform', 'DeviceInfo', 'Dimensions', 'Linking', 'Image', 'Share', 'Text']),
    ...useWebModules(
      [
        'Performance/Systrace',
        ['HMRLoadingView', 'Utilities/HMRLoadingView'],
        ['RCTNetworking', 'Network/RCTNetworking'],
      ],
      'expo/build/web/'
    ),
  ],
  resolve: {
    symlinks: false,
    extensions: ['.web.js', '.js', '.jsx', '.json'],
    alias: {
      'react-native$': 'react-native-web',
    },
    plugins: [
      // Adds support for installing with Plug'n'Play, leading to faster installs and adding
      // guards against forgotten dependencies and such.
      PnpWebpackPlugin,
      // Prevents users from importing files from outside of src/ (or node_modules/).
      // This often causes confusion because we only process files within src/ with babel.
      // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.
      new ModuleScopePlugin(locations.output, [locations.packageJson]),
    ],
  },
  resolveLoader: {
    plugins: [
      // Also related to Plug'n'Play, but this time it tells Webpack to load its loaders
      // from the current package.
      PnpWebpackPlugin.moduleLoader(module),
    ],
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
