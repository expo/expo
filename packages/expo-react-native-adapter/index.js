const NativeModulesProxy = require('./src/NativeModulesProxy');
const EventEmitter = require('./src/EventEmitter');
const NativeViewManagerAdapter = require('./src/NativeViewManagerAdapter');
const { Platform } = require('react-native');

module.exports = {
  Platform: {
    OS: Platform.OS
  },
  NativeModulesProxy,
  EventEmitter,
  requireNativeViewManager: NativeViewManagerAdapter.requireNativeViewManager,
};
