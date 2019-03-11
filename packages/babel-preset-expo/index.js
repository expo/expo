module.exports = function(api) {
  const isWeb = api.caller(isTargetWeb);

  if (isWeb) {
    return getWebConfig();
  }

  return getNativeConfig();
};

function getNativeConfig() {
  return {
    presets: ['module:metro-react-native-babel-preset'],
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

function getWebConfig() {
  const defaultPlugins = [
    ['@babel/plugin-transform-flow-strip-types'],
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          'react-native-vector-icons': '@expo/vector-icons',
          // Alias direct react-native imports to react-native-web
          'react-native$': 'react-native-web',
          // Add polyfills for modules that react-native-web doesn't support
          // Depends on expo-asset
          'react-native/Libraries/Image/AssetSourceResolver$':
            'expo-asset/build/AssetSourceResolver',
          'react-native/Libraries/Image/assetPathUtils$': 'expo-asset/build/Image/assetPathUtils',
          'react-native/Libraries/Image/resolveAssetSource$': 'expo-asset/build/resolveAssetSource',
          // Depends on expo-react-native-adapter pending: https://github.com/necolas/react-native-web/pull/1275
          'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
            'expo-react-native-adapter/build/vendor/RCTDeviceEventEmitter',
          // Alias internal react-native modules to react-native-web
          'react-native/Libraries/Components/View/ViewStylePropTypes$':
            'react-native-web/dist/exports/View/ViewStylePropTypes',

          // Link vendors
          // 'react-native/Libraries/vendor': 'react-native-web/dist/vendor/react-native',
          'react-native/Libraries/vendor/emitter/EventEmitter$':
            'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
          'react-native/Libraries/vendor/emitter/EventSubscriptionVendor$':
            'react-native-web/dist/vendor/react-native/emitter/EventSubscriptionVendor',
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
    [
      '@babel/plugin-transform-modules-commonjs',
      {
        strict: false,
        strictMode: false, // prevent "use strict" injections
        lazy: true,
        allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
      },
    ],
    ['@babel/plugin-transform-object-assign'],
    ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
    ['@babel/plugin-transform-react-display-name'],
    ['@babel/plugin-transform-react-jsx-source'],
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: true,
        regenerator: true,
        useESModules: true,
      },
    ],
  ];

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
