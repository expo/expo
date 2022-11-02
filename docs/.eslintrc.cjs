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
    'react/jsx-curly-brace-presence': [1, { propElementValues: 'ignore' }],
    // https://github.com/emotion-js/emotion/issues/2878
    'react/no-unknown-property': ['error', { 'ignore': ['css'] }]
  },
};
