function isTypeScriptSource(fileName) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName) {
  return !!fileName && fileName.endsWith('.tsx');
}

module.exports = function(api, options) {
  const isWeb = api.caller(isTargetWeb);
  if (isWeb) {
    return {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            useBuiltIns: false,
            targets: {
              esmodules: true,
            },
          },
        ],
      ],
      plugins: [
        'babel-plugin-react-native-web',
        [
          'babel-plugin-module-resolver',
          {
            alias: {
              'react-native-vector-icons$': '@expo/vector-icons',
              /** Alias direct react-native imports to react-native-web */
              'react-native$': 'react-native-web',
            },
          },
        ],
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        [
          '@babel/plugin-proposal-class-properties',
          // use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
          { loose: true },
        ],
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-proposal-export-default-from',
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: false,
            helpers: true,
            regenerator: true,
            useESModules: false,
          },
        ],
        '@babel/plugin-transform-react-jsx',
        '@babel/plugin-transform-object-assign',
        '@babel/plugin-transform-react-display-name',
        '@babel/plugin-transform-react-jsx-source',
        '@babel/plugin-transform-flow-strip-types',
      ],
      overrides: [
        {
          test: isTypeScriptSource,
          plugins: [[require('@babel/plugin-transform-typescript'), { isTSX: false }]],
        },
        {
          test: isTSXSource,
          plugins: [[require('@babel/plugin-transform-typescript'), { isTSX: true }]],
        },
        {
          plugins: [
            // non-standard
            ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
            ['@babel/plugin-proposal-optional-chaining', { loose: true }],
          ],
        },
      ],
    };
  }

  /** Native config  */
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            'react-native-vector-icons$': '@expo/vector-icons',
          },
        },
      ],
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-transform-runtime',
    ],
  };
};

function isTargetWeb(caller) {
  return caller && caller.name === 'babel-loader';
}
