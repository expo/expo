const { defineConfig } = require('eslint/config');
const globals = require('globals');

const coreConfig = require('./shared/core.js');
const {
  jsExtensions,
  tsExtensions,
  platformSubextensions,
  computeExpoExtensions,
} = require('./shared/extensions');
const prettierConfig = require('./shared/prettier.js');
const reactConfig = require('./shared/react.js');
const typescriptConfig = require('./shared/typescript.js');

const allExtensions = computeExpoExtensions(
  [...jsExtensions, ...tsExtensions],
  platformSubextensions,
);

module.exports = defineConfig([
  coreConfig,
  typescriptConfig,
  reactConfig,
  {
    languageOptions: {
      globals: {
        __DEV__: false,
        Atomics: false,
        ErrorUtils: false,
        FormData: false,
        SharedArrayBuffer: false,
        XMLHttpRequest: false,
        alert: false,
        cancelAnimationFrame: false,
        cancelIdleCallback: false,
        clearImmediate: false,
        clearInterval: false,
        clearTimeout: false,
        fetch: false,
        navigator: false,
        process: false,
        requestAnimationFrame: false,
        requestIdleCallback: false,
        setImmediate: false,
        setInterval: false,
        setTimeout: false,
        window: false,
      },
    },

    settings: {
      'import/extensions': allExtensions,

      'import/resolver': {
        node: {
          extensions: allExtensions,
        },
      },
    },
  },
  {
    files: ['**/*.web.*'],

    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  prettierConfig,
]);
