import universeNodeConfig from 'eslint-config-universe/flat/node.js';
import universeTypescriptAnalysisConfig from 'eslint-config-universe/flat/shared/typescript-analysis.js';
import universeWebConfig from 'eslint-config-universe/flat/web.js';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import lodash from 'eslint-plugin-lodash';
import * as mdx from 'eslint-plugin-mdx';
import testingLibrary from 'eslint-plugin-testing-library';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';

const CLASS_NAME_PREFIXES = ['container', 'icon', 'text'];

const CLASS_NAME_PATTERN = '(c|C)lass(Name)?$';

const TAILWIND_SETTINGS = {
  entryPoint: 'styles/global.css',
  callees: ['mergeClasses'],
  attributes: [`^(${CLASS_NAME_PREFIXES.join('|')})?${CLASS_NAME_PATTERN}`],
};

// Rules that are still active in ESLint (not migrated to oxlint or oxfmt)
const ACTIVE_RULES = {
  'no-return-await': 'off',
  'lodash/import-scope': [2, 'method'],
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
};

// Rules migrated to oxlint/oxfmt that must be explicitly turned off
// because eslint-config-universe re-enables them
const MIGRATED_RULES = {
  'prettier/prettier': 'off',
  'import/order': 'off',
  'import/no-cycle': 'off',
  'import/no-duplicates': 'off',
  'import/default': 'off',
  'import/namespace': 'off',
  'import/first': 'off',
  'import/no-named-as-default': 'off',
  'import/no-named-as-default-member': 'off',
  curly: 'off',
  eqeqeq: 'off',
  'no-void': 'off',
  'no-console': 'off',
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
  'n/handle-callback-err': 'off',
  'n/no-new-require': 'off',
  'n/no-path-concat': 'off',
  // TypeScript rules migrated to oxlint
  '@typescript-eslint/await-thenable': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/no-confusing-non-null-assertion': 'off',
  '@typescript-eslint/no-confusing-void-expression': 'off',
  '@typescript-eslint/no-dupe-class-members': 'off',
  '@typescript-eslint/no-extra-non-null-assertion': 'off',
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/no-for-in-array': 'off',
  '@typescript-eslint/no-misused-promises': 'off',
  '@typescript-eslint/no-restricted-types': 'off',
  '@typescript-eslint/no-unnecessary-type-assertion': 'off',
  '@typescript-eslint/no-unused-expressions': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-useless-constructor': 'off',
  '@typescript-eslint/only-throw-error': 'off',
  '@typescript-eslint/prefer-as-const': 'off',
  '@typescript-eslint/prefer-includes': 'off',
  '@typescript-eslint/prefer-nullish-coalescing': 'off',
  '@typescript-eslint/return-await': 'off',
  // Next.js rules migrated to oxlint
  '@next/next/google-font-display': 'off',
  '@next/next/google-font-preconnect': 'off',
  '@next/next/next-script-for-ga': 'off',
  '@next/next/no-async-client-component': 'off',
  '@next/next/no-before-interactive-script-outside-document': 'off',
  '@next/next/no-css-tags': 'off',
  '@next/next/no-head-element': 'off',
  '@next/next/no-html-link-for-pages': 'off',
  '@next/next/no-img-element': 'off',
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
  // React rules migrated to oxlint
  'react/no-unknown-property': 'off',
  'react/jsx-key': 'off',
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

  // Disable all rules migrated to oxlint/oxfmt (universe configs re-enable these)
  {
    rules: MIGRATED_RULES,
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
      'better-tailwindcss': betterTailwindcss,
      lodash,
      unicorn,
    },
    settings: {
      'better-tailwindcss': TAILWIND_SETTINGS,
    },
    rules: {
      ...ACTIVE_RULES,
      '@typescript-eslint/explicit-function-return-type': 'off',
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
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
      'react/no-this-in-sfc': 'off',
      'react/no-unescaped-entities': 'off',
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
      ...ACTIVE_RULES,
      ...MIGRATED_RULES,
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
