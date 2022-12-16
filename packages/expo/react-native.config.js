const path = require('path');

module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        packageImportPath: 'import expo.modules.ExpoModulesPackage;',
      },
    },
  },
};
