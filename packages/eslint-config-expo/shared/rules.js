const coreRules = {
  eqeqeq: ['warn', 'smart'],
  'no-dupe-args': 'error',
  'no-dupe-class-members': 'error',
  'no-dupe-keys': 'error',
  'no-duplicate-case': 'error',
  'no-empty-character-class': 'warn',
  'no-empty-pattern': 'warn',
  'no-extend-native': 'warn',
  'no-extra-bind': 'warn',
  'no-redeclare': 'warn',
  'no-undef': 'error',
  'no-unreachable': 'warn',
  'no-unsafe-negation': 'warn',
  'no-unused-expressions': ['warn', { allowShortCircuit: true, enforceForJSX: true }],
  'no-unused-labels': 'warn',
  'no-unused-vars': [
    'warn',
    {
      vars: 'all',
      args: 'none',
      ignoreRestSiblings: true,
      caughtErrors: 'all',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  'no-with': 'warn',
  'unicode-bom': ['warn', 'never'],
  'use-isnan': 'error',
  'valid-typeof': 'error',
  'import/first': 'warn',
  'import/default': 'off',
  'no-var': 'error',
};

const typescriptRules = {
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
};

// On top of the `recommended` presets of eslint-plugin-react and eslint-plugin-react-hooks.
const reactRules = {
  'react/no-unknown-property': 'warn',
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react/jsx-no-target-blank': 'off',
  'react/no-this-in-sfc': 'warn',
};

const expoRules = {
  'expo/use-dom-exports': ['error'],
  'expo/no-env-var-destructuring': ['error'],
  'expo/no-dynamic-env-var': ['error'],
};

module.exports = { coreRules, typescriptRules, reactRules, expoRules };
