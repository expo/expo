const lazyImportsBlacklist = require('./lazy-imports-blacklist');

module.exports = function(api, options = {}) {
  const { web = {}, native = {} } = options;

  const bundler = api.caller(getBundler);
  const isWebpack = bundler === 'webpack';
  let platform = api.caller(getPlatform);

  // If the `platform` prop is not defined then this must be a custom config that isn't
  // defining a platform in the babel-loader. Currently this may happen with Next.js + Expo web.
  if (!platform && isWebpack) {
    platform = 'web';
  }

  const platformOptions =
    platform === 'web'
      ? { disableImportExportTransform: true, ...web }
      : { disableImportExportTransform: false, ...native };

  // Note that if `options.lazyImports` is not set (i.e., `null` or `undefined`),
  // `metro-react-native-babel-preset` will handle it.
  const lazyImportsOption = options && options.lazyImports;

  return {
    presets: [
      [
        // We use `require` here instead of directly using the package name because we want to
        // specifically use the `metro-react-native-babel-preset` installed by this package (ex:
        // `babel-preset-expo/node_modules/`). This way the preset will not change unintentionally.
        // Reference: https://github.com/expo/expo/pull/4685#discussion_r307143920
        require('metro-react-native-babel-preset'),
        {
          disableImportExportTransform: platformOptions.disableImportExportTransform,
          lazyImportExportTransform:
            lazyImportsOption === true
              ? importModuleSpecifier => {
                  // Do not lazy-initialize packages that are local imports (similar to `lazy: true`
                  // behavior) or are in the blacklist.
                  return !(
                    importModuleSpecifier.includes('./') ||
                    lazyImportsBlacklist.has(importModuleSpecifier)
                  );
                }
              : // Pass the option directly to `metro-react-native-babel-preset`, which in turn
                // passes it to `babel-plugin-transform-modules-commonjs`
                lazyImportsOption,
        },
      ],
    ],
    plugins: [
      getAliasPlugin(),
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      platform === 'web' && [require.resolve('babel-plugin-react-native-web')],
      isWebpack && platform !== 'web' && [require.resolve('./plugins/disable-ambiguous-requires')],
    ].filter(Boolean),
  };
};

function getAliasPlugin() {
  const aliases = {};

  if (hasModule('@expo/vector-icons')) {
    aliases['react-native-vector-icons'] = '@expo/vector-icons';
  }

  if (Object.keys(aliases).length) {
    return [
      require.resolve('babel-plugin-module-resolver'),
      {
        alias: aliases,
      },
    ];
  }
  return null;
}

function hasModule(name) {
  try {
    return !!require.resolve(name);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(name)) {
      return false;
    }
    throw error;
  }
}

function getPlatform(caller) {
  return caller && caller.platform;
}

/**
 * Get the name of the `bundler`.
 *
 * @param {*} caller
 */
function getBundler(caller) {
  if (!caller) return null;

  const { bundler, name } = caller;

  if (!bundler) {
    if (name === 'metro') {
      // This is a hack to determine if metro is being used.
      return 'metro';
    } else if (name === 'babel-loader') {
      // This won't work in all cases as tools like Next.js could change the name of their loader.
      return 'webpack';
    }
  }
  // Perhaps we should add a check to log once when an unexpected bundler is being used.
  return bundler || null;
}
