module.exports = {
  root: true,
  plugins: ['expo'],
  extends: ['universe/native'],
  env: { browser: true },
  rules: {
    'expo/no-vector-icon-barrel': 'error',
  },
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
    },
  ],
};
