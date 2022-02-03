const path = require('path');

module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: path.join(__dirname, 'ios/Expo.podspec'),
        project: 'ios/Expo.xcodeproj',
      },
      android: {
        packageImportPath: 'import expo.modules.ExpoModulesPackage;',
      },
    },
  },
};
