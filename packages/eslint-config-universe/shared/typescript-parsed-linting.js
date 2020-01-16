module.exports = {
  extends: ['./typescript.js'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      rules: {
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'warn',
        '@typescript-eslint/no-throw-literal': 'warn',
      },
    },
  ],
};
