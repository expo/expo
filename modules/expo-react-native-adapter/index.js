const NativeModulesProxy = require('./src/NativeModulesProxy');
const EventEmitter = require('./src/EventEmitter');
const NativeViewManagerAdapter = require('./src/NativeViewManagerAdapter');

module.exports = {
  NativeModulesProxy,
  EventEmitter,
  requireNativeViewManager: NativeViewManagerAdapter.requireNativeViewManager,
};
