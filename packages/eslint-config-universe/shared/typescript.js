const { jsExtensions, tsExtensions } = require('./extensions');

const allExtensions = [...jsExtensions, ...tsExtensions];

module.exports = {
  extends: ['plugin:import/typescript'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/consistent-type-assertions': [
      'warn',
      { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow' },
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { vars: 'all', args: 'none', ignoreRestSiblings: true },
    ],
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'warn',
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Number: {
            message: 'Use `number` instead.',
            fixWith: 'number',
          },
          Boolean: {
            message: 'Use `boolean` instead.',
            fixWith: 'boolean',
          },
          Symbol: {
            message: 'Use `symbol` instead.',
            fixWith: 'symbol',
          },
          Object: {
            message: 'Use `object` instead.',
            fixWith: 'object',
          },
          String: {
            message: 'Use `string` instead.',
            fixWith: 'string',
          },
          '{}': {
            message: 'Use `object` instead.',
            fixWith: 'object',
          },
        },
      },
    ],
    '@typescript-eslint/array-type': [
      'warn',
      {
        default: 'array',
      },
    ],
    '@typescript-eslint/no-extra-non-null-assertion': 'warn',
  },
  settings: {
    'import/extensions': allExtensions,
    'import/parsers': {
      '@typescript-eslint/parser': tsExtensions,
    },
    'import/resolver': {
      node: { extensions: allExtensions },
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      parser: '@typescript-eslint/parser',
    },
  ],
};
