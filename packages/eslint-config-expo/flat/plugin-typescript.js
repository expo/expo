const { plugin, parser } = require('typescript-eslint');

module.exports = {
  name: 'expo/eslint/typescript',
  files: ['**/*.{ts,tsx,d.ts}'],
  ignores: ['expo-env.d.ts'],
  languageOptions: {
    parser,
    parserOptions: {
      // eslint-plugin-react@7.32.2 accesses superTypeParameters, which is deprecated by
      // typescript-estree and prints a warning by default
      suppressDeprecatedPropertyWarnings: true,
    },
  },
  plugins: {
    '@typescript-eslint': plugin,
  },
  rules: {
    '@typescript-eslint/array-type': ['warn', { default: 'array' }],
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Number: {
            message: 'Avoid referring to primitives by classes, use `number` instead.',
            fixWith: 'number',
          },
          Boolean: {
            message: 'Avoid referring to primitives by classes, use `boolean` instead.',
            fixWith: 'boolean',
          },
          Symbol: {
            message: 'Avoid referring to primitives by classes, use `symbol` instead.',
            fixWith: 'symbol',
          },
          Object: {
            message: 'Avoid referring to primitives by classes, use `object` instead.',
            fixWith: 'object',
          },
          String: {
            message: 'Avoid referring to primitives by classes, use `string` instead.',
            fixWith: 'string',
          },
        },
        extendDefaults: false,
      },
    ],
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
      { vars: 'all', args: 'none', ignoreRestSiblings: true, caughtErrors: 'all', caughtErrorsIgnorePattern: '^_' },
    ],

    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'warn',

    // The typescript-eslint FAQ recommends turning off "no-undef" in favor of letting tsc check for
    // undefined variables, including types
    'no-undef': 'off',
  },
};
