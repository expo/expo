import { defineConfig } from 'oxlint';

import defaultConfig from './default.js';

export default defineConfig({
  extends: [defaultConfig],
  ignorePatterns: ['__tests__/fixtures/**'],
});
