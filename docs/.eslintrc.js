module.exports = {
  root: true,
  extends: ['universe/node', 'universe/web', 'plugin:@next/next/recommended'],
  plugins: ['lodash', 'no-storage'],
  rules: {
    'lodash/import-scope': [2, 'method'],
    '@next/next/no-img-element': 0,
    "no-storage/no-browser-storage": 2
  },
};
