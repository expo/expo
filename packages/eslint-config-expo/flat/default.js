const coreConfig = require('./utils/core.js');
const expoConfig = require('./utils/expo.js');
const reactConfig = require('./utils/react.js');
const typescriptConfig = require('./utils/typescript.js');
const { allExtensions } = require('./utils/extensions.js');
const globals = require('globals');

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
        ...globals['shared-node-browser'],
        ...globals.browser,
        __DEV__: 'readonly',
        ErrorUtils: 'readonly',
        FormData: 'readonly',
        XMLHttpRequest: 'readonly',
        alert: 'readonly',
        cancelAnimationFrame: 'readonly',
        cancelIdleCallback: 'readonly',
        clearImmediate: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        process: 'readonly',
        requestAnimationFrame: 'readonly',
        requestIdleCallback: 'readonly',
        setImmediate: 'readonly',
        window: 'readonly',
      },
    },
  },
];
