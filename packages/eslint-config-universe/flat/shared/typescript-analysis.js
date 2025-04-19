const { defineConfig } = require('eslint/config');

const typescriptConfig = require('./typescript.js');

module.exports = defineConfig([
  typescriptConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],

    rules: {
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/no-confusing-non-null-assertion': 'warn',
      '@typescript-eslint/no-confusing-void-expression': 'warn',
      '@typescript-eslint/no-extra-non-null-assertion': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-for-in-array': 'error',

      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],

      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/only-throw-error': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/prefer-includes': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-return-await': 'off',
      '@typescript-eslint/return-await': ['error', 'always'],
    },
  },
]);
