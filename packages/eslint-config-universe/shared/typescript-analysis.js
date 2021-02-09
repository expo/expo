module.exports = {
  extends: ['./typescript.js'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      rules: {
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/no-throw-literal': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': 'warn',
        '@typescript-eslint/prefer-optional-chain': 'warn',
      },
    },
  ],
};
