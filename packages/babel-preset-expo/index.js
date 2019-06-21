const lazyImportsBlacklist = require('./lazy-imports-blacklist');

module.exports = function(api, options) {
  const isWeb = api.caller(isTargetWeb);

  if (isWeb) {
    return getWebConfig(options.web);
  }

  return getNativeConfig(options);
};

function getNativeConfig(options) {
  // Note that if `options.lazy` is not set (i.e., `null` or `undefined`),
  // `metro-react-native-babel-preset` will handle it.
  const lazy_option = options && options.lazy;
  return {
    presets: [
      [
        // TODO: use the actual plugin - but somehow `module:metro-react-native-babel-preset` is not up-to-date yet (need a version after this commit: https://github.com/facebook/metro/commit/23e3503dde5f914f3e642ef214f508d0a699851d)
        require('./node_modules/metro-react-native-babel-preset'),
        {
          lazyImportExportTransform:
            lazy_option === true
              ? require_name => {
                  // Do not lazy-initialize packages that are local imports (similar to `lazy: true` behavior)
                  // or are in the blacklist.
                  return !(require_name.includes('./') || lazyImportsBlacklist.has(require_name));
                }
              : // Pass the option directly to `metro-react-native-babel-preset`
                // (which in turns pass it to `babel-plugin-transform-modules-commonjs`).
                lazy_option,
        },
      ],
    ],
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            'react-native-vector-icons': '@expo/vector-icons',
          },
        },
      ],
      ['@babel/plugin-proposal-decorators', { legacy: true }],
    ],
  };
}

function getWebConfig(options = {}) {
  const defaultPlugins = [
    ['@babel/plugin-transform-flow-strip-types'],
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          'react-native-vector-icons': '@expo/vector-icons',
        },
      },
    ],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    [
      '@babel/plugin-proposal-class-properties',
      // use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
      { loose: true },
    ],
    ['@babel/plugin-syntax-dynamic-import'],
    ['@babel/plugin-transform-react-jsx'],
    ['babel-plugin-react-native-web'],
  ];

  const otherPlugins = [
    ['@babel/plugin-proposal-export-default-from'],
    ['@babel/plugin-transform-object-assign'],
    ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
    ['@babel/plugin-transform-react-display-name'],
    ['@babel/plugin-transform-react-jsx-source'],
    options.transformImportExport && ['@babel/plugin-transform-modules-commonjs'],
  ].filter(Boolean);

  return {
    comments: false,
    compact: true,

    presets: [
      [
        '@babel/preset-env',
        {
          modules: false,
          targets: {
            esmodules: true,
          },
        },
      ],
    ],
    overrides: [
      {
        plugins: defaultPlugins,
      },
      {
        test: isTypeScriptSource,
        plugins: [['@babel/plugin-transform-typescript', { isTSX: false }]],
      },
      {
        test: isTSXSource,
        plugins: [['@babel/plugin-transform-typescript', { isTSX: true }]],
      },
      {
        plugins: otherPlugins,
      },
    ],
  };
}

function isTargetWeb(caller) {
  return caller && caller.name === 'babel-loader';
}

function isTypeScriptSource(fileName) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName) {
  return !!fileName && fileName.endsWith('.tsx');
}
