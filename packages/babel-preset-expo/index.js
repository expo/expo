function isTypeScriptSource(fileName) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName) {
  return !!fileName && fileName.endsWith('.tsx');
}

module.exports = function(api, options) {
  const commonPlugins = [
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          'react-native-vector-icons$': '@expo/vector-icons',
        },
      },
    ],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
  ];

  const isWeb = api.caller(isTargetWeb);
  if (isWeb) {
    // disableImportExportTransform = true;
    return {
      presets: [
        [
          '@babel/preset-env',
          {
            loose: true,
            modules: false,
            useBuiltIns: false,
            // targets: { chrome: '72' },
          },
        ],
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
            ...commonPlugins,
            [
              '@babel/plugin-proposal-class-properties',
              // use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
              { loose: true },
            ],
            ['@babel/plugin-syntax-dynamic-import'],
            ['@babel/plugin-proposal-export-default-from'],
            // [
            //   '@babel/plugin-transform-modules-commonjs',
            //   {
            //     strict: false,
            //     strictMode: false, // prevent "use strict" injections
            //     lazy: true, //!!(options && options.lazyImportExportTransform),
            //     allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
            //   },
            // ],
            [
              '@babel/plugin-transform-runtime',
              {
                helpers: true,
                regenerator: true,
              },
            ],
            ['@babel/plugin-transform-react-jsx'],
            // ['@babel/plugin-transform-object-assign'],
            ['@babel/plugin-transform-react-display-name'],
            // ['@babel/plugin-transform-react-jsx-source'],
            ['@babel/plugin-transform-flow-strip-types'],
            // non-standard
            ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
            ['@babel/plugin-proposal-optional-chaining', { loose: true }],
          ],
        },
      ],
    };
  }

  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: commonPlugins,
  };
};

function isTargetWeb(caller) {
  return caller && caller.name === 'babel-loader';
}
