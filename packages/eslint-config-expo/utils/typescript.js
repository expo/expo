const { jsExtensions, tsExtensions } = require('./extensions');

const allExtensions = [...jsExtensions, ...tsExtensions];

module.exports = {
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': tsExtensions,
        },
      },
    },
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      extends: ['plugin:import/typescript'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/array-type': ['warn', { default: 'array' }],
        '@typescript-eslint/no-empty-object-type': 'warn',
        '@typescript-eslint/no-wrapper-object-types': 'warn',
        '@typescript-eslint/consistent-type-assertions': [
          'warn',
          { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow' },
        ],
        '@typescript-eslint/no-extra-non-null-assertion': 'warn',

        // Overrides
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': 'error',

        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'warn',

        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { vars: 'all', args: 'none', ignoreRestSiblings: true, caughtErrors: 'all' },
        ],

        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'warn',

        // The typescript-eslint FAQ recommends turning off "no-undef" in favor of letting tsc check for
        // undefined variables, including types
        'no-undef': 'off',

        // Prevent use of CJS `require` syntax unless importing assets to align with Metro behavior.
        '@typescript-eslint/no-require-imports': [
          'warn',
          {
            // Allow supported asset extensions:
            // https://github.com/facebook/metro/blob/9e1a6da5a7cd71bb9243f45644efe655870e5fff/packages/metro-config/src/defaults/defaults.js#L18-L53
            // https://github.com/expo/expo/blob/c774cfaa7898098411fc7e09dcb409b7cb5064f9/packages/%40expo/metro-config/src/ExpoMetroConfig.ts#L247-L254
            // Includes json which can be imported both as source and asset.
            allow: [
              '\\.(aac|aiff|avif|bmp|caf|db|gif|heic|html|jpeg|jpg|json|m4a|m4v|mov|mp3|mp4|mpeg|mpg|otf|pdf|png|psd|svg|ttf|wav|webm|webp|xml|yaml|yml|zip)$',
            ],
          },
        ],
      },
      settings: {
        'import/extensions': allExtensions,
        'import/parsers': {
          '@typescript-eslint/parser': tsExtensions,
        },
        'import/resolver': {
          node: { extensions: allExtensions },
        },
      },
    },
  ],
};
