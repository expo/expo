module.exports = {
  root: true,
  extends: ['universe/native'],
  env: { browser: true },
  rules: {
    // TODO(@kitten): Disable in universe in general; redundant with TypeScript
    'import/default': 'off',
    'import/export': 'off',
    'import/named': 'off',
    'import/namespace': 'off',
    'import/no-duplicates': 'off',
  },
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
    },
  ],
};
