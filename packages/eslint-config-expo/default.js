const {
  jsExtensions,
  tsExtensions,
  platformSubextensions,
  computeExpoExtensions,
} = require('./utils/extensions');

const allExtensions = computeExpoExtensions(
  [...jsExtensions, ...tsExtensions],
  platformSubextensions
);

module.exports = {
  extends: ['./utils/core.js', './utils/typescript.js', './utils/react.js', './utils/expo.js'],
  globals: {
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
  env: {
    'shared-node-browser': true,
  },
  settings: {
    'import/extensions': allExtensions,
    'import/resolver': {
      node: { extensions: allExtensions },
    },
  },
  overrides: [
    {
      files: ['*.web.*'],
      env: { browser: true },
    },
  ],
};
