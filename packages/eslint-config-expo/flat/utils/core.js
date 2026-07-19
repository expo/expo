const expo = require('eslint-plugin-expo');
const importPlugin = require('eslint-plugin-import');
const { jsExtensions } = require('./extensions');

const globals = require('globals');

module.exports = [
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.errors,
  {
    plugins: {
      expo,
    },

    languageOptions: {
      globals: {
        console: 'readonly',
        exports: false,
        global: false,
        module: false,
        require: false,
      },

      ecmaVersion: 2022,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
          jsx: true,
        },
      },
    },

    settings: {
      'import/ignore': ['node_modules[\\\\/]+@?react-native'],

      'import/extensions': jsExtensions,
      'import/resolver': {
        node: { extensions: jsExtensions },
        typescript: true,
      },
    },

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

      'no-unused-expressions': [
        'warn',
        {
          allowShortCircuit: true,
          enforceForJSX: true,
        },
      ],

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
      'import/first': 'warn',
      'import/default': 'off',
      'no-var': 'error',
    },
  },
  {
    files: ['**/*.d.ts'],

    rules: {
      'import/order': 'off',
    },
  },
  {
    files: ['**/metro.config.js'],

    languageOptions: {
      globals: globals.node,
    },
  },
];
