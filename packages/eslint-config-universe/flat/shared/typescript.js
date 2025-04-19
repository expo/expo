const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const { defineConfig } = require('eslint/config');
const importPlugin = require('eslint-plugin-import');

const { jsExtensions, tsExtensions } = require('./extensions');

const allExtensions = [...jsExtensions, ...tsExtensions];

module.exports = defineConfig([
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
    extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],

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

      '@typescript-eslint/no-empty-object-type': [
        'warn',
        {
          allowInterfaces: 'with-single-extends',
        },
      ],

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
      '@typescript-eslint/no-dupe-class-members': 'warn',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'warn',
      'no-unused-expressions': 'off',

      '@typescript-eslint/no-unused-expressions': [
        'warn',
        {
          allowShortCircuit: true,
          enforceForJSX: true,
        },
      ],

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

      // TODO (Kadi): Enable this. Disabling for now because import/recommended adds it, but we didn't use to have it enabled
      'import/no-unresolved': 'off',
    },
  },
]);
