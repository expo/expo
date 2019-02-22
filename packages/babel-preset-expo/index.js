module.exports = function(api) {
  const isWeb = api.caller(isTargetWeb);

  if (isWeb) {
    const defaultPlugins = [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            'react-native-vector-icons': '@expo/vector-icons',
            /** Alias direct react-native imports to react-native-web */
            'react-native$': 'react-native-web',
          },
        },
      ],
      ['@babel/plugin-syntax-flow'],
      ['@babel/plugin-proposal-optional-catch-binding'],
      ['@babel/plugin-transform-block-scoping'],
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      [
        '@babel/plugin-proposal-class-properties',
        // use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
        { loose: true },
      ],
      ['@babel/plugin-syntax-dynamic-import'],
      ['@babel/plugin-syntax-export-default-from'],
      ['@babel/plugin-transform-computed-properties'],
      ['@babel/plugin-transform-destructuring'],
      ['@babel/plugin-transform-function-name'],
      ['@babel/plugin-transform-literals'],
      ['@babel/plugin-transform-parameters'],
      ['@babel/plugin-transform-shorthand-properties'],
      ['@babel/plugin-transform-react-jsx'],
      ['@babel/plugin-transform-regenerator'],
      ['@babel/plugin-transform-sticky-regex'],
      ['@babel/plugin-transform-unicode-regex'],
      'babel-plugin-react-native-web',
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

      ['@babel/plugin-transform-arrow-functions'],
      ['@babel/plugin-transform-classes'],
      ['@babel/plugin-transform-for-of', { loose: true }],
      ['@babel/plugin-transform-spread'],
      [
        '@babel/plugin-transform-template-literals',
        { loose: true }, // dont 'a'.concat('b'), just use 'a'+'b'
      ],
      ['@babel/plugin-transform-exponentiation-operator'],
      ['@babel/plugin-transform-object-assign'],
      ['@babel/plugin-proposal-object-rest-spread'],
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
          useESModules: false,
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
            modules: false, //'commonjs',
            useBuiltIns: false,
            targets: {
              esmodules: true,
            },
          },
        ],
      ],
      overrides: [
        {
          plugins: ['@babel/plugin-transform-flow-strip-types'],
        },
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

  /** Native config  */
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
      'babel-plugin-react-native-web',
    ],
  };
};

function isTargetWeb(caller) {
  return caller && caller.name === 'babel-loader';
}

function isTypeScriptSource(fileName) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName) {
  return !!fileName && fileName.endsWith('.tsx');
}
