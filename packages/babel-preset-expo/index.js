module.exports = function(api, options) {
  const isWeb = api.caller(isTargetWeb);

  if (isWeb) {
    return getWebConfig(options.web);
  }

  return getNativeConfig();
};

const universalAliases = [
  'babel-plugin-module-resolver',
  {
    alias: {
      'react-native-vector-icons': '@expo/vector-icons',
    },
  },
];

const universalProposalDecorators = [
  require('@babel/plugin-proposal-decorators').default,
  { legacy: true },
];

function getNativeConfig() {
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [universalAliases, universalProposalDecorators],
  };
}

function getWebConfig(options = {}) {
  const isEnv = getWebEnv();

  const babelEnvironmentOptions = isEnv.test
    ? {
        // ES features necessary for user's Node version
        targets: {
          node: 'current',
        },
      }
    : {
        // Latest ECMAScript features

        // Allow importing core-js in entrypoint and use browserlist to select polyfills
        useBuiltIns: 'entry',
        // Set the corejs version we are using to avoid warnings in console
        // This will need to change once we upgrade to corejs@3
        corejs: 3,
        // Do not transform modules to CJS
        modules: false,
        // Exclude transforms that make all code slower
        exclude: ['transform-typeof-symbol'],
      };

  const presets = [
    [require('@babel/preset-env').default, babelEnvironmentOptions],
    [
      // Use preset-react to control the following plugins:
      // - @babel/helper-plugin-utils
      // - @babel/plugin-transform-react-display-name
      // - @babel/plugin-transform-react-jsx-source
      // - @babel/plugin-transform-react-jsx-self
      // - @babel/plugin-transform-react-jsx
      require('@babel/preset-react').default,
      {
        // Adds component stack to warning messages
        // Adds __self attribute to JSX which React will use for some warnings
        development: !isEnv.production,
        // Will use the native built-in instead of trying to polyfill
        // behavior for any plugins that require one.
        useBuiltIns: true,
      },
    ],
    // preset-typescript will test file extensions for ts & tsx then transform accordingly
    // - @babel/helper-plugin-utils
    // - @babel/plugin-transform-typescript
    [require('@babel/preset-typescript').default],
  ].filter(Boolean);

  const plugins = [
    // Strip flow types before any other transform, emulating the behavior
    // order as-if the browser supported all of the succeeding features
    // We will conditionally enable this plugin below in overrides as it clashes with
    // @babel/plugin-proposal-decorators when using TypeScript.
    // https://github.com/facebook/create-react-app/issues/5741
    [require('@babel/plugin-transform-flow-strip-types').default, false],
    // Remap modules across web & native.
    universalAliases,
    // Remap all of the react-native imports to react-native-web to improve tree-shaking.
    require('babel-plugin-react-native-web'),
    // Turn on legacy decorators for TypeScript files
    [require('@babel/plugin-proposal-decorators').default, false],
    // class { handleClick = () => { } }
    // Enable loose mode to use assignment instead of defineProperty
    // See discussion in https://github.com/facebook/create-react-app/issues/4263
    [
      // use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
      require('@babel/plugin-proposal-class-properties').default,
      {
        loose: true,
      },
    ],
    // The following two plugins use Object.assign directly, instead of Babel's
    // extends helper. Note that this assumes `Object.assign` is available.
    // { ...todo, completed: true }
    [
      require('@babel/plugin-proposal-object-rest-spread').default,
      {
        useBuiltIns: true,
      },
    ],
    // Polyfills the runtime needed for async/await, generators, and friends
    // https://babeljs.io/docs/en/babel-plugin-transform-runtime
    [
      require('@babel/plugin-transform-runtime').default,
      {
        corejs: false,
        helpers: false,
        regenerator: true,
      },
    ],
    isEnv.production && [
      // Remove PropTypes from production build
      require('babel-plugin-transform-react-remove-prop-types').default,
      {
        removeImport: true,
      },
    ],
    // Adds syntax support for import()
    require('@babel/plugin-syntax-dynamic-import').default,
    isEnv.test &&
      // Transform dynamic import to require
      require('babel-plugin-dynamic-import-node'),
  ].filter(Boolean);

  // Use internals from `module:metro-react-native-babel-preset` to create closer parity with react-native.
  const metroPlugins = [
    // export v from 'mod';
    [require('@babel/plugin-proposal-export-default-from').default],
    //
    [require('@babel/plugin-transform-object-assign').default],
    [require('@babel/plugin-proposal-nullish-coalescing-operator').default, { loose: true }],
    [require('@babel/plugin-proposal-optional-chaining').default, { loose: true }],
    options.transformImportExport && [require('@babel/plugin-transform-modules-commonjs').default],
  ].filter(Boolean);

  const overrides = [
    {
      exclude: /\.tsx?$/,
      plugins: [require('@babel/plugin-transform-flow-strip-types').default],
    },
    {
      test: /\.tsx?$/,
      plugins: [universalProposalDecorators],
    },
    {
      // Metro uses overrides.
      plugins: metroPlugins,
    },
  ];

  return {
    // Babel assumes ES Modules, which isn't safe until CommonJS
    // dies. This changes the behavior to assume CommonJS unless
    // an `import` or `export` is present in the file.
    // https://github.com/webpack/webpack/issues/4039#issuecomment-419284940
    sourceType: 'unambiguous',
    // Remove all comments
    comments: false,
    // Reduce dependencies
    // https://babeljs.io/docs/en/index#compact
    compact: true,
    presets,
    plugins,
    overrides,
  };
}

function isTargetWeb(caller) {
  return caller && caller.name === 'babel-loader';
}

function getWebEnv() {
  const env = process.env.BABEL_ENV || process.env.NODE_ENV;

  const development = env === 'development';
  const production = env === 'production';
  const test = env === 'test';

  if (!development && !production && !test) {
    // This is done in expo-cli before `expo build:web` and `expo start` (+ Webpack initialization)
    throw new Error(
      'Using `babel-preset-react-app` requires that you specify `NODE_ENV` or ' +
        '`BABEL_ENV` environment variables. Valid values are "development", ' +
        '"test", and "production". Instead, received: ' +
        JSON.stringify(env) +
        '.'
    );
  }

  return {
    development,
    production,
    test,
  };
}
