const coreConfig = require('eslint-config-expo/utils/core.js');
const expoConfig = require('eslint-config-expo/utils/expo.js');
const reactConfig = require('eslint-config-expo/utils/react.js');
const typescriptConfig = require('eslint-config-expo/utils/typescript.js');
const { allExtensions } = require('eslint-config-expo/utils/extensions.js');

module.exports = [
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
        'shared-node-browser': true,
      },
    },
  },
  {
    files: ['*.web.*'],
    env: { browser: true },
  },
];
