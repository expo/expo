const { jsExtensions } = require('./extensions');

module.exports = {
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
    ecmaFeatures: { impliedStrict: true, jsx: true },
  },
  env: { es2022: true },
  globals: {
    console: 'readonly',
    exports: false,
    global: false,
    module: false,
    require: false,
  },
  extends: ['plugin:import/errors'],
  plugins: ['import', 'expo'],
  rules: {
    eqeqeq: ['warn', 'smart'],
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty-character-class': 'warn',
    'no-empty-pattern': 'warn',
    'no-extend-native': 'warn',
    'no-extra-bind': 'warn',
    'no-redeclare': 'warn',
    'no-undef': 'error',
    'no-unreachable': 'warn',
    'no-unsafe-negation': 'warn',
    'no-unused-expressions': ['warn', { allowShortCircuit: true, enforceForJSX: true }],
    'no-unused-labels': 'warn',
    'no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'none',
        ignoreRestSiblings: true,
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-with': 'warn',
    'unicode-bom': ['warn', 'never'],
    'use-isnan': 'error',
    'valid-typeof': 'error',
    'import/first': 'warn', //keep
    'import/default': 'off',
    'no-var': 'error',
  },
  settings: {
    'import/extensions': jsExtensions,
    'import/ignore': [
      // react-native's main module is Flow, not JavaScript, and raises parse errors. Additionally,
      // several other react-native-related packages still publish Flow code as their main source.
      'node_modules[\\\\/]+@?react-native',
    ],
    'import/resolver': {
      node: { extensions: jsExtensions },
      typescript: true,
    },
  },
  overrides: [
    {
      files: ['*.d.ts'],
      rules: {
        'import/order': 'off',
      },
    },
    {
      files: ['metro.config.js'],
      env: {
        node: true,
      },
    },
  ],
};
