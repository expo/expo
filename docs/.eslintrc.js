module.exports = {
  root: true,
  extends: ['universe/node', 'universe/web', 'plugin:@next/next/recommended'],
  plugins: ['lodash'],
  rules: {
    'lodash/import-scope': [2, 'method'],
    '@next/next/no-img-element': 0,
    'react/jsx-curly-brace-presence': [1, { propElementValues: 'ignore' }],
  },
};
