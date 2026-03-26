import nextPlugin from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import universeNodeConfig from 'eslint-config-universe/flat/node.js';
import universeTypescriptAnalysisConfig from 'eslint-config-universe/flat/shared/typescript-analysis.js';
import universeWebConfig from 'eslint-config-universe/flat/web.js';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import lodash from 'eslint-plugin-lodash';
import * as mdx from 'eslint-plugin-mdx';
import testingLibrary from 'eslint-plugin-testing-library';
import unicorn from 'eslint-plugin-unicorn'; // eslint-disable-line

const CLASS_NAME_PREFIXES = ['container', 'icon', 'text'];

const CLASS_NAME_PATTERN = '(c|C)lass(Name)?$';

const TAILWIND_SETTINGS = {
  entryPoint: 'styles/global.css',
  callees: ['mergeClasses'],
  attributes: [`^(${CLASS_NAME_PREFIXES.join('|')})?${CLASS_NAME_PATTERN}`],
};

const CORE_RULES = {
  'prettier/prettier': 'error',
  'no-void': 'off', // migrated to oxlint
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
  curly: 'off', // migrated to oxlint
  eqeqeq: 'off', // migrated to oxlint
  'import/no-cycle': 'off', // migrated to oxlint
  'lodash/import-scope': [2, 'method'],
  'unicorn/better-regex': 'warn', // stays in ESLint (no oxlint support)
  'unicorn/consistent-date-clone': 'off', // migrated to oxlint
  'unicorn/explicit-length-check': 'off', // migrated to oxlint
  'unicorn/new-for-builtins': 'off', // migrated to oxlint
  'unicorn/no-useless-spread': 'off', // migrated to oxlint
  'unicorn/no-unnecessary-array-splice-count': 'off', // migrated to oxlint
  'unicorn/prefer-array-some': 'off', // migrated to oxlint
  'unicorn/prefer-at': 'off', // migrated to oxlint
  'unicorn/prefer-date-now': 'off', // migrated to oxlint
  'unicorn/prefer-set-has': 'off', // migrated to oxlint
  'unicorn/prefer-includes': 'off', // migrated to oxlint
  'unicorn/prefer-regexp-test': 'off', // migrated to oxlint
  'unicorn/prefer-node-protocol': 'off', // migrated to oxlint
  'unicorn/prefer-string-slice': 'off', // migrated to oxlint
  'unicorn/throw-new-error': 'off', // migrated to oxlint
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
  ], // stays in ESLint (no oxlint support)
};

export default defineConfig([
  globalIgnores([
    '**/.cache',
    '**/.next/',
    '**/.swc/',
    '**/.wrangler/',
    '**/.worker-test/',
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

  // Disable universe config rules migrated to oxlint (Batch 1.5a + 1.5b)
  {
    rules: {
      // Batch 1.5b: TS rules from universe configs
      '@typescript-eslint/no-dupe-class-members': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-for-in-array': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      // Batch 1.5a: core JS + node + import
      'constructor-super': 'off',
      'no-array-constructor': 'off',
      'no-caller': 'off',
      'no-case-declarations': 'off',
      'no-compare-neg-zero': 'off',
      'no-cond-assign': 'off',
      'no-const-assign': 'off',
      'no-constant-condition': 'off',
      'no-debugger': 'off',
      'no-delete-var': 'off',
      'no-dupe-class-members': 'off',
      'no-dupe-keys': 'off',
      'no-duplicate-case': 'off',
      'no-empty-character-class': 'off',
      'no-empty-pattern': 'off',
      'no-eval': 'off',
      'no-ex-assign': 'off',
      'no-extend-native': 'off',
      'no-extra-bind': 'off',
      'no-extra-boolean-cast': 'off',
      'no-fallthrough': 'off',
      'no-func-assign': 'off',
      'no-global-assign': 'off',
      'no-inner-declarations': 'off',
      'no-invalid-regexp': 'off',
      'no-irregular-whitespace': 'off',
      'no-iterator': 'off',
      'no-label-var': 'off',
      'no-labels': 'off',
      'no-lone-blocks': 'off',
      'no-multi-assign': 'off',
      'no-new': 'off',
      'no-new-func': 'off',
      'no-object-constructor': 'off',
      'no-new-native-nonconstructor': 'off',
      'no-obj-calls': 'off',
      'no-proto': 'off',
      'no-return-assign': 'off',
      'no-script-url': 'off',
      'no-self-assign': 'off',
      'no-self-compare': 'off',
      'no-sequences': 'off',
      'no-shadow-restricted-names': 'off',
      'no-sparse-arrays': 'off',
      'no-this-before-super': 'off',
      'no-throw-literal': 'off',
      'no-unneeded-ternary': 'off',
      'no-unsafe-negation': 'off',
      'no-unused-expressions': 'off',
      'no-unused-labels': 'off',
      'no-unused-vars': 'off',
      'no-useless-computed-key': 'off',
      'no-useless-concat': 'off',
      'no-useless-constructor': 'off',
      'no-useless-escape': 'off',
      'no-useless-rename': 'off',
      'no-useless-return': 'off',
      'no-var': 'off',
      'no-with': 'off',
      'prefer-const': 'off',
      'prefer-promise-reject-errors': 'off',
      'prefer-rest-params': 'off',
      'prefer-spread': 'off',
      radix: 'off',
      'unicode-bom': 'off',
      'use-isnan': 'off',
      'valid-typeof': 'off',
      yoda: 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'n/handle-callback-err': 'off',
      'n/no-new-require': 'off',
      'n/no-path-concat': 'off',
    },
  },

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
      'better-tailwindcss': betterTailwindcss,
      lodash,
      unicorn,
    },
    settings: {
      'better-tailwindcss': TAILWIND_SETTINGS,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...CORE_RULES,
      'lodash/import-scope': [2, 'method'],
      '@next/next/no-img-element': 'off', // stays off, also off in oxlint
      'no-console': 'off', // migrated to oxlint
      'import/no-duplicates': 'off', // migrated to oxlint
      'import/default': 'off', // migrated to oxlint
      'import/namespace': 'off', // migrated to oxlint
      'import/first': 'off', // migrated to oxlint
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
      '@typescript-eslint/await-thenable': 'off', // migrated to oxlint
      '@typescript-eslint/no-misused-promises': 'off', // migrated to oxlint
      '@typescript-eslint/no-floating-promises': 'off', // migrated to oxlint
      '@typescript-eslint/return-await': 'off', // migrated to oxlint
      '@typescript-eslint/no-confusing-non-null-assertion': 'off', // migrated to oxlint
      '@typescript-eslint/no-extra-non-null-assertion': 'off', // migrated to oxlint
      '@typescript-eslint/prefer-as-const': 'off', // migrated to oxlint
      '@typescript-eslint/prefer-includes': 'off', // migrated to oxlint
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off', // migrated to oxlint
      '@typescript-eslint/no-unnecessary-type-assertion': 'off', // migrated to oxlint
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // migrated to oxlint
      '@typescript-eslint/no-restricted-types': 'off', // migrated to oxlint
      'react/no-this-in-sfc': 'off',
      'react/no-unknown-property': 'off', // migrated to oxlint
      'react/no-unescaped-entities': 'off',
      'react/jsx-key': 'off', // migrated to oxlint
      // Next.js rules migrated to oxlint
      '@next/next/google-font-display': 'off',
      '@next/next/google-font-preconnect': 'off',
      '@next/next/next-script-for-ga': 'off',
      '@next/next/no-async-client-component': 'off',
      '@next/next/no-before-interactive-script-outside-document': 'off',
      '@next/next/no-css-tags': 'off',
      '@next/next/no-head-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-page-custom-font': 'off',
      '@next/next/no-styled-jsx-in-document': 'off',
      '@next/next/no-sync-scripts': 'off',
      '@next/next/no-title-in-document-head': 'off',
      '@next/next/no-typos': 'off',
      '@next/next/no-unwanted-polyfillio': 'off',
      '@next/next/inline-script-id': 'off',
      '@next/next/no-assign-module-variable': 'off',
      '@next/next/no-document-import-in-page': 'off',
      '@next/next/no-duplicate-head': 'off',
      '@next/next/no-head-import-in-document': 'off',
      '@next/next/no-script-component-in-head': 'off',
      'better-tailwindcss/enforce-consistent-class-order': 'off',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/enforce-shorthand-classes': 'error',
      'better-tailwindcss/no-unknown-classes': [
        'error',
        {
          ignore: [
            'diff-.+',
            'react-player',
            'dark-theme',
            'dialog-.+',
            'terminal-snippet',
            'table-wrapper',
            'tutorial-code-annotation',
            'max-sm:.+',
            'max-medium:.+',
            'max-md-gutters:.+',
            '\\[table_&\\]:.+',
            '\\[table_&\\]',
          ],
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
    rules: {
      ...CORE_RULES,
      'import/no-duplicates': 'off', // migrated to oxlint
      'import/default': 'off', // migrated to oxlint
      'import/namespace': 'off', // migrated to oxlint
      'import/first': 'off', // migrated to oxlint
    },
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
