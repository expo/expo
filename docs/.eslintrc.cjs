const TAILWIND_DEFAULTS = {
  callees: ['mergeClasses'],
  classRegex: '^(confirmation|container|icon)?(c|C)lass(Name)?$',
};

module.exports = {
  root: true,
  extends: ['universe/web', 'plugin:prettier/recommended', 'plugin:@next/next/recommended'],
  plugins: ['lodash'],
  rules: {
    'lodash/import-scope': [2, 'method'],
  },
  overrides: [
    {
      files: ['*.jsx', '*.tsx'],
      extends: ['plugin:@next/next/recommended', 'plugin:tailwindcss/recommended'],
      rules: {
        '@next/next/no-img-element': 'off',
        'react/jsx-curly-brace-presence': [1, { propElementValues: 'ignore' }],
        // https://github.com/emotion-js/emotion/issues/2878
        'react/no-unknown-property': ['error', { ignore: ['css'] }],
        'tailwindcss/classnames-order': 'off',
        'tailwindcss/enforces-negative-arbitrary-values': 'warn',
        'tailwindcss/enforces-shorthand': 'warn',
        'tailwindcss/no-arbitrary-value': 'off',
        'tailwindcss/no-custom-classname': [
          'warn',
          {
            whitelist: [
              'diff-.+',
              'react-player',
              'dark-theme',
              'dialog-.+',
              'terminal-snippet',
              'table-wrapper',
            ],
            cssFiles: ['node_modules/@expo/styleguide/dist/global.css'],
            ...TAILWIND_DEFAULTS,
          },
        ],
        'tailwindcss/no-unnecessary-arbitrary-value': ['warn', TAILWIND_DEFAULTS],
      },
    },
    {
      files: ['*.js', '*.cjs', '*.ts'],
      extends: ['universe/node'],
    },
    {
      files: ['*.md', '*.mdx'],
      extends: ['plugin:mdx/recommended'],
      rules: {
        'no-unused-expressions': 'off',
        'no-useless-escape': 'off',
        'no-irregular-whitespace': 'off',
        'react/self-closing-comp': 'off',
      },
    },
    {
      files: ['**/*-test.[jt]s?(x)'],
      plugins: ['testing-library'],
      extends: ['plugin:testing-library/react'],
    },
  ],
};
