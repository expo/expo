const path = require('path');

module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: path.join(__dirname, 'ios/ExpoModulesCore.podspec'),
        project: 'ios/ExpoModulesCore.xcodeproj',
      },
      android: {
        packageImportPath: 'import expo.modules.adapters.react.ModuleRegistryAdapter;',
      },
    },
  },
};
