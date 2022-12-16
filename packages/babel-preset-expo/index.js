const lazyImportsBlacklist = require('./lazy-imports-blacklist');

let hasWarnedJsxRename = false;

module.exports = function (api, options = {}) {
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
      ? {
          // Only disable import/export transform when Webpack is used because
          // Metro does not support tree-shaking.
          disableImportExportTransform: !!isWebpack,
          ...web,
        }
      : { disableImportExportTransform: false, ...native };

  // Note that if `options.lazyImports` is not set (i.e., `null` or `undefined`),
  // `metro-react-native-babel-preset` will handle it.
  const lazyImportsOption = options && options.lazyImports;

  const extraPlugins = [];

  if ('useTransformReactJsxExperimental' in platformOptions && !hasWarnedJsxRename) {
    // https://github.com/expo/expo/pull/13945#pullrequestreview-724327024
    hasWarnedJsxRename = true;
    console.warn(
      'Warning: useTransformReactJsxExperimental has been renamed to useTransformReactJSXExperimental (capitalized JSX) in react-native@0.64.0'
    );
  }

  // Set true to disable `@babel/plugin-transform-react-jsx`
  // we override this logic outside of the metro preset so we can add support for
  // React 17 automatic JSX transformations.
  // If the logic for `useTransformReactJSXExperimental` ever changes in `metro-react-native-babel-preset`
  // then this block should be updated to reflect those changes.
  if (!platformOptions.useTransformReactJSXExperimental) {
    extraPlugins.push([
      require('@babel/plugin-transform-react-jsx'),
      {
        // Defaults to `automatic`, pass in `classic` to disable auto JSX transformations.
        runtime: (options && options.jsxRuntime) || 'automatic',
        ...(options &&
          options.jsxRuntime !== 'classic' && {
            importSource: (options && options.jsxImportSource) || 'react',
          }),
      },
    ]);
    // Purposefully not adding the deprecated packages:
    // `@babel/plugin-transform-react-jsx-self` and `@babel/plugin-transform-react-jsx-source`
    // back to the preset.
  }

  return {
    presets: [
      [
        // We use `require` here instead of directly using the package name because we want to
        // specifically use the `metro-react-native-babel-preset` installed by this package (ex:
        // `babel-preset-expo/node_modules/`). This way the preset will not change unintentionally.
        // Reference: https://github.com/expo/expo/pull/4685#discussion_r307143920
        require('metro-react-native-babel-preset'),
        {
          // Defaults to undefined, set to something truthy to disable `@babel/plugin-transform-react-jsx-self` and `@babel/plugin-transform-react-jsx-source`.
          withDevTools: platformOptions.withDevTools,
          // Defaults to undefined, set to `true` to disable `@babel/plugin-transform-flow-strip-types`
          disableFlowStripTypesTransform: platformOptions.disableFlowStripTypesTransform,
          // Defaults to undefined, set to `false` to disable `@babel/plugin-transform-runtime`
          enableBabelRuntime: platformOptions.enableBabelRuntime,
          // Defaults to `'default'`, can also use `'hermes-canary'`
          unstable_transformProfile: platformOptions.unstable_transformProfile,
          // Set true to disable `@babel/plugin-transform-react-jsx` and
          // the deprecated packages `@babel/plugin-transform-react-jsx-self`, and `@babel/plugin-transform-react-jsx-source`.
          //
          // Otherwise, you'll sometime get errors like the following (starting in Expo SDK 43, React Native 64, React 17):
          //
          // TransformError App.js: /path/to/App.js: Duplicate __self prop found. You are most likely using the deprecated transform-react-jsx-self Babel plugin.
          // Both __source and __self are automatically set when using the automatic jsxRuntime. Please remove transform-react-jsx-source and transform-react-jsx-self from your Babel config.
          useTransformReactJSXExperimental: true,

          disableImportExportTransform: platformOptions.disableImportExportTransform,
          lazyImportExportTransform:
            lazyImportsOption === true
              ? (importModuleSpecifier) => {
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
      getObjectRestSpreadPlugin(),
      ...extraPlugins,
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

/**
 * metro-react-native-babel-preset configures this plugin with `{ loose: true }`, which breaks all
 * getters and setters in spread objects. We need to add this plugin ourself without that option.
 * @see https://github.com/expo/expo/pull/11960#issuecomment-887796455
 */
function getObjectRestSpreadPlugin() {
  return [require.resolve('@babel/plugin-proposal-object-rest-spread'), { loose: false }];
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
    } else if (name === 'next-babel-turbo-loader') {
      // NextJS 11
      return 'webpack';
    } else if (name === 'babel-loader') {
      // expo/webpack-config, gatsby, storybook, and next.js <10
      return 'webpack';
    }
  }
  // Perhaps we should add a check to log once when an unexpected bundler is being used.
  return bundler || null;
}
