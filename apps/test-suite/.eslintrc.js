module.exports = {
  root: true,
  extends: ['universe/native', 'universe/web'],
  rules: {
    'no-useless-escape': 0,
    // TODO(@kitten): Disable in universe in general; redundant with TypeScript
    'import/default': 'off',
    'import/export': 'off',
    'import/named': 'off',
    'import/namespace': 'off',
    'import/no-duplicates': 'off',
  },
};
