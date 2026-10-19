import base from '@expo/internal-scripts/oxlint.config.base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [base],
  ignorePatterns: base.ignorePatterns,
  rules: {
    // Demo screens intentionally render impure values (`Date.now()`, `Math.random()`).
    'react/purity': 'off',
  },
});
