const globals = require('globals');

const { allExtensions } = require('../shared/extensions');
const { reactNativeGlobals } = require('../shared/globals');
const { importSettings } = require('../shared/settings');
const coreConfig = require('./utils/core.js');
const expoConfig = require('./utils/expo.js');
const reactConfig = require('./utils/react.js');
const typescriptConfig = require('./utils/typescript.js');

module.exports = [
  ...coreConfig,
  ...typescriptConfig,
  ...reactConfig,
  ...expoConfig,
  {
    settings: importSettings(allExtensions),
    languageOptions: {
      globals: {
        ...globals['shared-node-browser'],
        ...globals.browser,
        ...reactNativeGlobals,
      },
    },
  },
];
