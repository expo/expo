import base from '@expo/internal-scripts/oxlint.config.base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [base],
  ignorePatterns: base.ignorePatterns,
  overrides: [
    {
      // Vendored React Navigation code; keep the diff against upstream minimal.
      files: ['src/react-navigation/**'],
      rules: {
        'react/preserve-manual-memoization': 'off',
      },
    },
    {
      files: ['src/**/*.{ts,tsx}'],
      excludeFiles: [
        'src/loaders/LoaderRuntime.ts',
        'src/loaders/__tests__/LoaderClient.test.ts',
        'src/loaders/__tests__/LoaderSuspenseStore.test.ts',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '**/LoaderClient',
                  '**/LoaderClient.*',
                  '**/LoaderSuspenseStore',
                  '**/LoaderSuspenseStore.*',
                ],
                message: 'Use LoaderRuntime to coordinate loader requests and Suspense state.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/loaders/LoaderClient.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: ['./LoaderSuspenseStore', './LoaderSuspenseStore.*'] },
        ],
      },
    },
  ],
  rules: {
    'import/no-cycle': 'error',
    // expo-router passes `children` via props in a number of places (notably tests); accepted here.
    'react/no-children-prop': 'off',
  },
});
