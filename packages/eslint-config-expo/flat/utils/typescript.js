const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const { jsExtensions, tsExtensions } = require('./extensions');
const importPlugin = require('eslint-plugin-import');

const allExtensions = [...jsExtensions, ...tsExtensions];

module.exports = [
  importPlugin.flatConfigs.typescript,
  {
    files: ['**/*.js', '**/*.jsx'],

    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': tsExtensions,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],

    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
    },

    settings: {
      'import/extensions': allExtensions,

      'import/parsers': {
        '@typescript-eslint/parser': tsExtensions,
      },

      'import/resolver': {
        node: {
          extensions: allExtensions,
        },
      },
    },

    rules: {
      '@typescript-eslint/array-type': [
        'warn',
        {
          default: 'array',
        },
      ],

      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-wrapper-object-types': 'warn',

      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow',
        },
      ],

      '@typescript-eslint/no-extra-non-null-assertion': 'warn',
      'no-dupe-class-members': 'off',
      '@typescript-eslint/no-dupe-class-members': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'warn',
      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'none',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
        },
      ],

      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'warn',
      'no-undef': 'off',
    },
  },
];
