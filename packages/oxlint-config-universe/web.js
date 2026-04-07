import { defineConfig } from 'oxlint';

import core from './shared/core.js';
import react from './shared/react.js';
import typescript from './shared/typescript.js';

export default defineConfig({
  extends: [core, typescript, react],
  env: { browser: true, commonjs: true },
});
