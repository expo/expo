// https://docs.expo.dev/guides/using-eslint/
import { defineConfig, globalIgnores } from 'eslint/config';
import universeNodeConfig from 'eslint-config-universe/flat/node.js';
import lodash from 'eslint-plugin-lodash';

export default defineConfig([
  globalIgnores(['**/build', '**/cache', '**/node_modules']),
  universeNodeConfig,
  {
    plugins: {
      lodash,
    },
    rules: {
      'lodash/import-scope': [2, 'method'],
      // note(simek): I'm not brave enough to touch the RegExps I did not write,
      // if you are, feel free to remove line below and fix the reported issues
      'no-useless-escape': 0,
    },
  },
]);
