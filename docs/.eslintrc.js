module.exports = {
  root: true,
  extends: ['universe/node', 'universe/web', 'plugin:@next/next/recommended'],
  plugins: ['lodash'],
  rules: {
    'lodash/import-scope': [2, 'method'],
  },
};
