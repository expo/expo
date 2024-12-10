const TAILWIND_DEFAULTS = {
  callees: ['mergeClasses'],
  classRegex: '^(confirmation|container|icon)?(c|C)lass(Name)?$',
};

module.exports = {
  root: true,
  extends: [
    'universe/web',
    'universe/node',
    'universe/shared/typescript-analysis',
    'plugin:prettier/recommended',
    'plugin:@next/next/recommended',
    'plugin:tailwindcss/recommended',
  ],
  plugins: ['lodash', 'unicorn'],
  rules: {
    'lodash/import-scope': [2, 'method'],
  },
  ignorePatterns: ['.next/', '.swc/', '.yarn/', 'types/global.d.ts'],
  overrides: [
    {
      files: ['*.jsx', '*.ts', '*.tsx'],
      parserOptions: {
        project: './tsconfig.json',
      },
      extends: ['plugin:@next/next/recommended', 'plugin:tailwindcss/recommended'],
      rules: {
        'prettier/prettier': 'error',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        '@typescript-eslint/explicit-function-return-type': [
          'off',
          {
            allowExpressions: true,
          },
        ],
        '@typescript-eslint/naming-convention': [
          'warn',
          { selector: 'typeLike', format: ['PascalCase'] },
          { selector: 'enumMember', format: ['UPPER_CASE'] },
          {
            selector: ['variable', 'parameter'],
            modifiers: ['destructured'],
            format: null,
          },
          {
            selector: ['objectLiteralProperty', 'objectLiteralMethod'],
            format: null,
          },
          {
            selector: 'typeProperty',
            format: ['camelCase', 'snake_case', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'allowSingleOrDouble',
          },
          {
            selector: 'default',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'allow',
          },
          {
            selector: ['function', 'variable', 'method'],
            format: ['camelCase'],
            modifiers: ['async'],
            leadingUnderscore: 'allow',
            suffix: ['Async'],
            filter: {
              regex: 'getServerSideProps',
              match: false,
            },
          },
        ],
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            checksVoidReturn: false,
          },
        ],
        '@typescript-eslint/no-floating-promises': 'error',
        'no-void': ['warn', { allowAsStatement: true }],
        'no-return-await': 'off',
        '@typescript-eslint/return-await': ['error', 'always'],
        '@typescript-eslint/no-confusing-non-null-assertion': 'warn',
        '@typescript-eslint/no-extra-non-null-assertion': 'warn',
        '@typescript-eslint/prefer-as-const': 'warn',
        '@typescript-eslint/prefer-includes': 'warn',
        '@typescript-eslint/prefer-readonly': 'warn',
        '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
        '@typescript-eslint/prefer-ts-expect-error': 'warn',
        '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': [
          'warn',
          {
            ignoreConditionalTests: true,
            ignoreMixedLogicalExpressions: true,
          },
        ],
        '@typescript-eslint/no-restricted-types': [
          'warn',
          {
            types: {
              CurrentUserDataFragment: {
                suggest: ["LoggedInProps['currentUser']", "PageProps['currentUser']"],
              },
            },
          },
        ],
        'import/order': [
          'warn',
          {
            groups: [['external', 'builtin'], 'internal', ['parent', 'sibling']],
            'newlines-between': 'always',
            alphabetize: {
              order: 'asc',
            },
            pathGroups: [
              {
                pattern: '~/**',
                group: 'internal',
              },
            ],
          },
        ],
        curly: 'warn',
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        'import/no-cycle': ['error', { maxDepth: '∞' }],
        'lodash/import-scope': [2, 'method'],
        'react/no-this-in-sfc': 'off',
        'react/no-unknown-property': ['error', { ignore: ['css', 'mask-type'] }],
        '@next/next/no-img-element': 'off',
        'react/no-unescaped-entities': 'off',
        'tailwindcss/classnames-order': 'off',
        'tailwindcss/enforces-negative-arbitrary-values': 'error',
        'tailwindcss/enforces-shorthand': 'error',
        'tailwindcss/no-arbitrary-value': 'off',
        'tailwindcss/no-custom-classname': [
          'error',
          {
            cssFiles: ['node_modules/@expo/styleguide/dist/global.css'],
            whitelist: [
              'diff-.+',
              'react-player',
              'dark-theme',
              'dialog-.+',
              'terminal-snippet',
              'table-wrapper',
            ],
            ...TAILWIND_DEFAULTS,
          },
        ],
        'tailwindcss/no-unnecessary-arbitrary-value': ['error', TAILWIND_DEFAULTS],
        'react/jsx-key': [
          'error',
          {
            checkFragmentShorthand: true,
            checkKeyMustBeforeSpread: true,
            warnOnDuplicates: true,
          },
        ],
        'no-restricted-properties': [
          'warn',
          {
            object: 'it',
            property: 'only',
            message: 'it.only should not be committed to main.',
          },
          {
            object: 'test',
            property: 'only',
            message: 'test.only should not be committed to main.',
          },
          {
            object: 'describe',
            property: 'only',
            message: 'describe.only should not be committed to main.',
          },
        ],
        'unicorn/new-for-builtins': 'warn',
        'unicorn/no-useless-spread': 'warn',
        'unicorn/prefer-array-some': 'warn',
        'unicorn/prefer-at': 'warn',
        'unicorn/prefer-includes': 'warn',
        'unicorn/prefer-regexp-test': 'warn',
        'unicorn/throw-new-error': 'warn',
        'unicorn/prefer-node-protocol': 'warn',
        'unicorn/prefer-date-now': 'warn',
        'unicorn/better-regex': 'warn',
        'unicorn/prevent-abbreviations': [
          'warn',
          {
            extendDefaultReplacements: false,
            replacements: {
              e: {
                error: true,
                event: true,
              },
            },
          },
        ],
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
