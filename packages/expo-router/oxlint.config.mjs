import base from 'expo-module-scripts/oxlint.config.base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [base],
  ignorePatterns: base.ignorePatterns,
  rules: {
    // expo-router passes `children` via props in a number of places (notably tests); accepted here.
    'react/no-children-prop': 'off',
  },
});
