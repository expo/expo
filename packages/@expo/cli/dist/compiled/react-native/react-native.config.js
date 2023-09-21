'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var ios = require('@react-native-community/cli-platform-ios');
var android = require('@react-native-community/cli-platform-android');
module.exports = {
  commands: [].concat((0, _toConsumableArray2.default)(ios.commands), (0, _toConsumableArray2.default)(android.commands)),
  platforms: {
    ios: {
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig
    },
    android: {
      projectConfig: android.projectConfig,
      dependencyConfig: android.dependencyConfig
    }
  },
  reactNativePath: '.',
  project: {
    ios: {
      sourceDir: '../packages/rn-tester'
    },
    android: {
      sourceDir: '../packages/rn-tester'
    }
  }
};