import native from 'oxlint-config-universe/native';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [native],
  // NOTE: oxlint does not inherit `ignorePatterns` through `extends` (see https://github.com/oxc-project/oxc/issues/10223),
  // so configs that extend this base must re-apply them via `ignorePatterns: base.ignorePatterns`.
  ignorePatterns: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/vendor/**',
    '**/__generated__/**',
    '**/.expo/**',
    '**/.next/**',
  ],
  overrides: [
    {
      files: ['**/__tests__/**', '**/e2e/**', '**/mocks/**'],
      env: { node: true },
      globals: {
        // Tests reassign `__DEV__`
        __DEV__: 'writable',
      },
      rules: {
        // Tests need to re-assign imported bindings to install mocks and spies.
        'no-import-assign': 'off',
        // Tests use chained assignment (`a = b = c`).
        'no-multi-assign': 'off',
        // Tests construct objects purely for their side effects (e.g. registering a listener).
        'no-new': 'off',
        // Mock/stub classes often define empty or passthrough constructors.
        'no-useless-constructor': 'off',
        // Incorrectly flags `#` as an escape character in source map tests
        'no-useless-escape': 'off',
        // Missing keys in throwaway render arrays inside tests don't affect what the test verifies.
        'react/jsx-key': 'off',
        // Tests reject with the non-Error shapes that real APIs have (e.g. `@expo/spawn-async`)
        'prefer-promise-reject-errors': 'off',
      },
    },
    {
      files: ['**/*.js', '**/*.d.ts'],
      rules: {
        'import/export': 'off',
      },
    },
    {
      files: ['*.config.js', '.*rc.js'],
      env: { node: true },
    },
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
      rules: {
        // Already handled by TypeScript itself, enabling them blocks legitimate type overloads.
        'no-redeclare': 'off',
        'typescript/no-redeclare': 'off',
        // Handled by TypeScript.
        'no-unused-expressions': 'off',
        'typescript/no-unused-expressions': 'off',
        'no-unused-vars': 'off',
        'typescript/no-unused-vars': 'off',
        'no-useless-return': 'off',
        'no-dupe-class-members': 'off',
      },
    },
  ],
  rules: {
    // fbjs is a Facebook-internal package not intended to be a public API.
    'no-restricted-imports': ['warn', { patterns: ['fbjs/*', 'fbjs'] }],

    // -----------------------------
    // --- Intentional patterns  ---
    // -----------------------------

    'no-async-promise-executor': 'off',
    // We match terminal/ANSI control characters in regexes.
    'no-control-regex': 'off',
    // Empty leading branches (e.g. `if (x) {} else if ...`) are used as intentional guard clauses.
    'no-lone-blocks': 'off',
    // We declare properties on `globalThis`.
    'no-shadow-restricted-names': 'off',
    // Throwing non-Error values is an accepted pattern in this codebase.
    'no-throw-literal': 'off',
    // Handled by TypeScript.
    'no-unsafe-optional-chaining': 'off',
    // Handled by TypeScript.
    'typescript/no-non-null-asserted-optional-chain': 'off',
    // Triple-slash references are an accepted pattern in this codebase.
    'typescript/triple-slash-reference': 'off',
    // Empty files are intentional platform-specific no-op stubs (e.g. `*.web.ts` overrides).
    'unicorn/no-empty-file': 'off',
    // `new Array(n)` is used intentionally to pre-allocate arrays.
    'unicorn/no-new-array': 'off',
    // We intentionally construct Promise-like (thenable) objects.
    'unicorn/no-thenable': 'off',
    // The `children` prop is an accepted pattern in this codebase.
    'react/no-children-prop': 'off',
    // Enums occasionally alias a value.
    'typescript/no-duplicate-enum-values': 'off',

    // -----------------
    // --- Stylistic ---
    // -----------------

    // `curly` is enabled by oxlint-config-universe but was suppressed under the ESLint setup by
    // eslint-config-prettier. Kept off here so the switch to oxlint is behavior-neutral; the final
    // migration commit flips this to 'warn' and runs `oxlint --fix` to add the braces.
    curly: 'off',
    'no-useless-computed-key': 'off',
    'unicorn/prefer-string-starts-ends-with': 'off',
    'unicorn/no-useless-fallback-in-spread': 'off',
    'unicorn/no-useless-spread': 'off',

    // React props that pass JSX should always be wrapped by curly braces.
    'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never', propElementValues: 'always' }],
  },
});
