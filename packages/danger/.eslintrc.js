module.exports = {
  root: false,
  extends: 'universe/node',
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
      globals: { __DEV__: true },
    },
  ],
  globals: {
    /**
     * Danger.js globals
     */
    danger: 'readonly',
    message: 'readonly',
    warn: 'readonly',
    fail: 'readonly',
    markdown: 'readonly',
  },
};
