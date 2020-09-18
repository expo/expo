module.exports = {
  root: true,
  extends: ['universe/native'],
  parserOptions: {
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  env: { browser: true },
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
    },
  ],
};
