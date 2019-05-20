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
