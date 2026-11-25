import base from '@expo/internal-scripts/oxlint.config.base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [base],
  ignorePatterns: [...base.ignorePatterns, 'src/index.d.ts'],
});
