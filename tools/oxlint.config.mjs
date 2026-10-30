import base from '@expo/internal-scripts/oxlint.config.base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [base],
  ignorePatterns: [...base.ignorePatterns, '**/cache/**'],
  overrides: [
    {
      // The build-equivalence harness declares its worker helpers inside the block that uses them.
      files: ['scripts/**'],
      rules: { 'no-inner-declarations': 'off' },
    },
  ],
  rules: {
    'no-restricted-imports': ['warn', { paths: ['lodash'], patterns: ['fbjs/*', 'fbjs'] }],
    'no-useless-escape': 'off',
  },
});
