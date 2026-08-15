import base from 'expo-module-scripts/oxlint.config.base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [base],
  ignorePatterns: base.ignorePatterns,
  overrides: [
    {
      // Ported Metro require runtime intentionally reads `arguments` and throws a dev-only
      // invariant check inside a `finally`.
      files: ['metro-require/**'],
      rules: { 'prefer-rest-params': 'off', 'no-unsafe-finally': 'off' },
    },
  ],
});
