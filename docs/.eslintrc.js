module.exports = {
  root: true,
  extends: [
    'universe/node',
    'universe/web',
    'plugin:@next/next/recommended',
    'plugin:testing-library/react',
  ],
  plugins: ['lodash', 'testing-library'],
  rules: {
    'lodash/import-scope': [2, 'method'],
    '@next/next/no-img-element': 0,
  },
};
