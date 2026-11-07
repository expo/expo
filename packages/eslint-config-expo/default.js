const { allExtensions } = require('./shared/extensions');
const { reactNativeGlobals } = require('./shared/globals');
const { importSettings } = require('./shared/settings');

module.exports = {
  extends: ['./utils/core.js', './utils/typescript.js', './utils/react.js', './utils/expo.js'],
  globals: reactNativeGlobals,
  env: {
    browser: true,
    'shared-node-browser': true,
  },
  settings: importSettings(allExtensions),
};
