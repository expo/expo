import universeNodeConfig from 'eslint-config-universe/flat/node.js';
import universeTypescriptAnalysisConfig from 'eslint-config-universe/flat/shared/typescript-analysis.js';
import universeWebConfig from 'eslint-config-universe/flat/web.js';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import lodash from 'eslint-plugin-lodash';
import * as mdx from 'eslint-plugin-mdx';
import oxlint from 'eslint-plugin-oxlint';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';

const TAILWIND_SETTINGS = {
  entryPoint: 'styles/global.css',
  callees: ['mergeClasses'],
  attributes: ['^(container|icon|text)?(c|C)lass(Name)?$'],
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

// Rules not auto-detected by eslint-plugin-oxlint:
// - oxfmt handles these (not in .oxlintrc.json)
// - type-aware TS rules (eslint-plugin-oxlint doesn't read type-aware overrides)
// - @next/next/no-img-element (set to 'off' in oxlint, so the plugin skips it)
const MIGRATED_RULES_MANUAL = {
  'prettier/prettier': 'off',
  'import/order': 'off',
  'prefer-promise-reject-errors': 'off',
  '@typescript-eslint/await-thenable': 'off',
  '@typescript-eslint/no-confusing-void-expression': 'off',
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/no-for-in-array': 'off',
  '@typescript-eslint/no-misused-promises': 'off',
  '@typescript-eslint/no-unnecessary-type-assertion': 'off',
  '@typescript-eslint/only-throw-error': 'off',
  '@typescript-eslint/prefer-includes': 'off',
  '@typescript-eslint/prefer-nullish-coalescing': 'off',
  '@typescript-eslint/return-await': 'off',
  '@next/next/no-img-element': 'off',
};

export default defineConfig([
  globalIgnores([
    '**/.cache',
    '**/.next/',
    '**/.swc/',
    '**/.wrangler/',
    '**/.worker-test/',
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

  // Auto-disable ESLint rules that oxlint handles (reads .oxlintrc.json)
  // Filter out MDX ignore since ESLint still needs to lint MDX via eslint-plugin-mdx
  ...oxlint
    .buildFromOxlintConfigFile('./.oxlintrc.json')
    .map(c => (c.ignores ? { ...c, ignores: c.ignores.filter(p => p !== '**/*.{md,mdx}') } : c)),

  // Manual overrides for rules the auto plugin misses
  {
    rules: MIGRATED_RULES_MANUAL,
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
    files: ['**/*.js', '**/*.cjs'],
    plugins: {
      lodash,
      unicorn,
    },
    extends: [universeNodeConfig],
    rules: {
      ...ACTIVE_RULES,
      ...MIGRATED_RULES_MANUAL,
      ...Object.fromEntries(
        oxlint
          .buildFromOxlintConfigFile('./.oxlintrc.json')
          .flatMap(c => Object.entries(c.rules ?? {}))
      ),
    },
  },

  // MDX configuration
  {
    ...mdx.flat,
    files: ['**/*.mdx'],
    languageOptions: {
      ...mdx.flat.languageOptions,
      parserOptions: { extensions: ['.js', '.md', '.mdx'] },
    },
    rules: {
      ...mdx.flat.rules,
      'import/no-unresolved': 'error',
      'no-unused-vars': ['warn', { vars: 'all', args: 'none', ignoreRestSiblings: true }],
      'no-unused-expressions': 'off',
      'no-useless-escape': 'off',
      'no-irregular-whitespace': 'off',
      'react/self-closing-comp': 'off',
    },
  },
]);
