const coreConfig = require('./utils/core.js');
const expoConfig = require('./utils/expo.js');
const reactConfig = require('./utils/react.js');
const typescriptConfig = require('./utils/typescript.js');
const { allExtensions } = require('./utils/extensions.js');
const { defineConfig } = require('eslint/config');
const globals = require('globals');

module.exports = defineConfig([
  ...coreConfig,
  ...typescriptConfig,
  ...reactConfig,
  ...expoConfig,
  {
    settings: {
      'import/extensions': allExtensions,
      'import/resolver': {
        node: { extensions: allExtensions },
      },
    },
    languageOptions: {
      globals: {
        ...globals['shared-node-browser'],
        ...globals.browser,
        __DEV__: 'readonly',
        ErrorUtils: false,
        FormData: false,
        XMLHttpRequest: false,
        alert: false,
        cancelAnimationFrame: false,
        cancelIdleCallback: false,
        clearImmediate: false,
        fetch: false,
        navigator: false,
        process: false,
        requestAnimationFrame: false,
        requestIdleCallback: false,
        setImmediate: false,
        window: false,
      },
    },
  },
  {
    files: ['*.web.*'],
  },
]);
