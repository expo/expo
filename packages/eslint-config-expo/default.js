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
