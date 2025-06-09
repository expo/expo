import nextPlugin from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import universeNodeConfig from 'eslint-config-universe/flat/node.js';
import universeTypescriptAnalysisConfig from 'eslint-config-universe/flat/shared/typescript-analysis.js';
import universeWebConfig from 'eslint-config-universe/flat/web.js';
import lodash from 'eslint-plugin-lodash';
import * as mdx from 'eslint-plugin-mdx';
import tailwind from 'eslint-plugin-tailwindcss';
import testingLibrary from 'eslint-plugin-testing-library';
import unicorn from 'eslint-plugin-unicorn'; // eslint-disable-line

const TAILWIND_DEFAULTS = {
  callees: ['mergeClasses'],
  classRegex: '^(confirmation|container|icon)?(c|C)lass(Name)?$',
};

const CORE_RULES = {
  'prettier/prettier': 'error',
  'no-void': ['warn', { allowAsStatement: true }],
  'no-return-await': 'off',
  'import/order': [
    'error',
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
  'unicorn/better-regex': 'warn',
  'unicorn/consistent-date-clone': 'warn',
  'unicorn/explicit-length-check': 'warn',
  'unicorn/new-for-builtins': 'warn',
  'unicorn/no-useless-spread': 'warn',
  'unicorn/no-unnecessary-array-splice-count': 'warn',
  'unicorn/prefer-array-some': 'warn',
  'unicorn/prefer-at': 'warn',
  'unicorn/prefer-date-now': 'warn',
  'unicorn/prefer-set-has': 'warn',
  'unicorn/prefer-includes': 'warn',
  'unicorn/prefer-regexp-test': 'warn',
  'unicorn/prefer-node-protocol': 'warn',
  'unicorn/prefer-string-slice': 'warn',
  'unicorn/throw-new-error': 'warn',
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
};

export default defineConfig([
  globalIgnores([
    '**/.cache',
    '**/.next/',
    '**/.swc/',
    '**/.yarn/',
    '**/.vale',
    '**/node_modules',
    '**/out',
    '**/public',
    'pages/versions/latest',
    'scripts/generate-llms/talks.js',
    'types/global.d.ts',
    'README.md',
    'next-env.d.ts',
  ]),
  universeWebConfig,
  universeNodeConfig,
  universeTypescriptAnalysisConfig,

  // Overrides needed to make flat config rules work
  {
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    plugins: {
      '@next/next': nextPlugin,
      tailwind,
      lodash,
      unicorn,
    },
    extends: ['tailwind/flat/recommended'],
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...CORE_RULES,
      'lodash/import-scope': [2, 'method'],
      '@next/next/no-img-element': 'off',
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
      '@typescript-eslint/return-await': ['error', 'always'],
      '@typescript-eslint/no-confusing-non-null-assertion': 'warn',
      '@typescript-eslint/no-extra-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/prefer-includes': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          minimumDescriptionLength: 3,
          'ts-check': false,
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': [
        'warn',
        {
          ignoreConditionalTests: true,
          ignoreMixedLogicalExpressions: true,
        },
      ],
      '@typescript-eslint/no-restricted-types': 'warn',
      'react/no-this-in-sfc': 'off',
      'react/no-unknown-property': ['error', { ignore: ['css', 'mask-type'] }],
      'react/no-unescaped-entities': 'off',
      'react/jsx-key': [
        'error',
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
          warnOnDuplicates: true,
        },
      ],
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
            'tutorial-code-annotation',
          ],
          ...TAILWIND_DEFAULTS,
        },
      ],
      'tailwindcss/no-unnecessary-arbitrary-value': ['error', TAILWIND_DEFAULTS],
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
    },
  },

  // JavaScript/Node files configuration
  {
    files: ['**/*.js', '**/*.cjs', '**/*.ts'],
    plugins: {
      lodash,
      unicorn,
    },
    extends: [universeNodeConfig],
    rules: CORE_RULES,
  },

  // MDX configuration
  {
    ...mdx.flat,
    languageOptions: {
      ...mdx.flat.languageOptions,
      parserOptions: { extensions: ['.js', '.md', '.mdx'] },
    },
    rules: {
      ...mdx.flat.rules,
      'no-unused-expressions': 'off',
      'no-useless-escape': 'off',
      'no-irregular-whitespace': 'off',
      'react/self-closing-comp': 'off',
    },
  },

  // Test files configuration
  {
    files: ['**/*-test.[jt]s?(x)'],
    ...testingLibrary.configs['flat/react'],
  },
]);
