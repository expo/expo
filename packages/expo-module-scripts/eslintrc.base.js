module.exports = {
  root: true,
  extends: ['universe/native'],
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
      globals: { __DEV__: true },
    },
    {
      files: ['./*.config.js', './.*rc.js'],
      extends: ['universe/node'],
    },

    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      rules: {
        // NOTE: This is already handled by TypeScript itself
        // Turning this on blocks legitimate type overloads
        // TODO(@kitten): Please move this to universe
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'off',

        // NOTE: Handled by TypeScript
        // TODO(@kitten): Please move this to universe
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      }
    },
  ],
  rules: {
    'no-restricted-imports': [
      'warn',
      {
        // fbjs is a Facebook-internal package not intended to be a public API
        patterns: ['fbjs/*', 'fbjs'],
      },
    ],
  },
};
