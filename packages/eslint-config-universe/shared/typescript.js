const { jsExtensions, tsExtensions } = require('./extensions');

const allExtensions = [...jsExtensions, ...tsExtensions];

module.exports = {
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      extends: ['plugin:import/typescript'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/array-type': ['warn', { default: 'array' }],
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
            extendDefaults: false,
          },
        ],
        '@typescript-eslint/consistent-type-assertions': [
          'warn',
          { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow' },
        ],
        '@typescript-eslint/no-extra-non-null-assertion': 'warn',

        // Overrides
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': 'warn',

        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'warn',

        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { vars: 'all', args: 'none', ignoreRestSiblings: true, caughtErrors: 'all' },
        ],

        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'warn',

        // The typescript-eslint FAQ recommends turning off "no-undef" in favor of letting tsc check for
        // undefined variables, including types
        'no-undef': 'off',
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
    },
  ],
};
