import base from 'expo-module-scripts/oxlint.config.base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [base],
  // `dev-plugin-webui` is its own workspace package and lints itself.
  ignorePatterns: [
    ...base.ignorePatterns,
    'dev-plugin-dist/**',
    'dev-plugin-webui/**',
    'web/wa-sqlite/**',
  ],
});
