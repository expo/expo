import { defineConfig } from 'oxlint';

/**
 * Type-aware TypeScript rules.
 *
 * These rules require access to the TypeScript type checker and must be
 * enabled with the `typeAware` option in your oxlint config.
 *
 * Extends the base typescript config.
 */
export default defineConfig({
  plugins: ['typescript'],
  options: {
    typeAware: true,
  },
  rules: {
    'typescript/await-thenable': 'warn',
    'typescript/no-confusing-non-null-assertion': 'warn',
    'typescript/no-confusing-void-expression': 'warn',
    'typescript/no-extra-non-null-assertion': 'warn',
    'typescript/no-floating-promises': 'warn',
    'typescript/no-for-in-array': 'error',
    'typescript/no-misused-promises': ['error', { checksVoidReturn: false }],
    'typescript/no-unnecessary-type-assertion': 'warn',
    'typescript/only-throw-error': 'warn',
    'typescript/prefer-as-const': 'warn',
    'typescript/prefer-includes': 'warn',
    'typescript/prefer-nullish-coalescing': 'warn',
    'typescript/prefer-optional-chain': 'warn',
    'typescript/prefer-readonly': 'warn',
    'typescript/prefer-string-starts-ends-with': 'warn',
    'typescript/prefer-ts-expect-error': 'warn',

    'typescript/return-await': ['error', 'always'],
  },
});
