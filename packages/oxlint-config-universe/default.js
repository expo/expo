import { defineConfig } from 'oxlint';

import core from './shared/core.js';
import typescript from './shared/typescript.js';

export default defineConfig({
  extends: [core, typescript],
});
