module.exports = {
  root: true,
  extends: ['universe/native'],
  env: { browser: true },
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
    },
  ],
};
