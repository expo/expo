import base from 'expo-module-scripts/oxlint.config.base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [base],
  ignorePatterns: base.ignorePatterns,
  overrides: [
    {
      files: ['e2e/fixtures/project_files/maestro/tests/**'],
      rules: {
        'no-var': 'off',
        'object-shorthand': 'off',
      },
    },
    {
      files: ['e2e/fixtures/project_files/maestro/updates-server/**'],
      rules: {
        'import/first': 'off',
      },
    },
  ],
});
