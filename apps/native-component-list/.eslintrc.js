module.exports = {
  root: true,
  extends: ['universe/native'],
  env: { browser: true },
  rules: {
  },
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
    },
  ],
};
