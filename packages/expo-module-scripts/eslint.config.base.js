const universeNativeConfig = require('eslint-config-universe/flat/native');
const universeNodeConfig = require('eslint-config-universe/flat/node');

// TODO(kudo,20250507): Workaround to use ESLint 9 from the eslint-config-universe.
// Remove this once we drop support for ESLint 8 in expo-module-scripts.
const universeRoot = require.resolve('eslint-config-universe/package.json');
const { defineConfig } = require(
  require.resolve('eslint/config', {
    paths: [universeRoot],
  })
);
const globals = require(require.resolve('globals', { paths: [universeRoot] }));

module.exports = defineConfig([
  {
    extends: universeNativeConfig,

    rules: {
      'no-restricted-imports': [
        'warn',
        {
          // fbjs is a Facebook-internal package not intended to be a public API
          patterns: ['fbjs/*', 'fbjs'],
        },
      ],
    },
  },
  {
    files: ['**/__tests__/*'],

    languageOptions: {
      globals: {
        ...globals.node,
        __DEV__: true,
      },
    },
  },
  {
    files: ['./*.config.js', './.*rc.js'],
    extends: universeNodeConfig,
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],

    rules: {
      // NOTE: This is already handled by TypeScript itself
      // Turning this on blocks legitimate type overloads
      // TODO(@kitten): Please move this to universe
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'off',

      // NOTE: Handled by TypeScript
      // TODO(@kitten): Please move this to universe
      'no-unused-expressions': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);
