var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeDeviceEventManager = _interopRequireDefault(require("../../Libraries/NativeModules/specs/NativeDeviceEventManager"));
var _RCTDeviceEventEmitter = _interopRequireDefault(require("../EventEmitter/RCTDeviceEventEmitter"));
var DEVICE_BACK_EVENT = 'hardwareBackPress';
var _backPressSubscriptions = [];
_RCTDeviceEventEmitter.default.addListener(DEVICE_BACK_EVENT, function () {
  for (var i = _backPressSubscriptions.length - 1; i >= 0; i--) {
    if (_backPressSubscriptions[i]()) {
      return;
    }
  }
  BackHandler.exitApp();
});
var BackHandler = {
  exitApp: function exitApp() {
    if (!_NativeDeviceEventManager.default) {
      return;
    }
    _NativeDeviceEventManager.default.invokeDefaultBackPressHandler();
  },
  addEventListener: function addEventListener(eventName, handler) {
    if (_backPressSubscriptions.indexOf(handler) === -1) {
      _backPressSubscriptions.push(handler);
    }
    return {
      remove: function remove() {
        return BackHandler.removeEventListener(eventName, handler);
      }
    };
  },
  removeEventListener: function removeEventListener(eventName, handler) {
    var index = _backPressSubscriptions.indexOf(handler);
    if (index !== -1) {
      _backPressSubscriptions.splice(index, 1);
    }
  }
};
module.exports = BackHandler;
//# sourceMappingURL=BackHandler.android.js.map