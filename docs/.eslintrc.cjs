module.exports = {
  root: true,
  extends: [
    'universe/node',
    'universe/web',
    'plugin:@next/next/recommended',
    'plugin:testing-library/react',
    'plugin:tailwindcss/recommended'
  ],
  plugins: ['lodash', 'testing-library'],
  rules: {
    'lodash/import-scope': [2, 'method'],
    '@next/next/no-img-element': 0,
    'react/jsx-curly-brace-presence': [1, { propElementValues: 'ignore' }],
    // https://github.com/emotion-js/emotion/issues/2878
    'react/no-unknown-property': ['error', { 'ignore': ['css'] }],
    'tailwindcss/classnames-order': 'off',
    'tailwindcss/enforces-negative-arbitrary-values': 'warn',
    'tailwindcss/enforces-shorthand': 'warn',
    'tailwindcss/no-arbitrary-value': 'off',
    'tailwindcss/no-custom-classname': ['warn', {
      callees: ['mergeClasses'],
      whitelist: [
        'diff-.+',
        'react-player',
        'dark-theme',
        'dialog-.+',
        'terminal-snippet'
      ],
      cssFiles: [
        "node_modules/@expo/styleguide/dist/global.css"
      ],
      classRegex: '^(confirmation|container|icon)?(c|C)lass(Name)?$',
    }],
  }
};
