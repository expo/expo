module.exports = {
  root: true,
  extends: ['universe/native'],
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
    },
  ],
};
