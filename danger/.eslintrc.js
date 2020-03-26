module.exports = {
  root: true,
  extends: ['universe/node'],
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
      globals: { __DEV__: true },
      rules: {
        'array-type': [true, 'generic'],
      },
    },
  ],
};
