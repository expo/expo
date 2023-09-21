var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeEventEmitter = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _NativeDevSettings = _interopRequireDefault(require("../NativeModules/specs/NativeDevSettings"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var DevSettings = {
  addMenuItem: function addMenuItem(title, handler) {},
  reload: function reload(reason) {},
  onFastRefresh: function onFastRefresh() {}
};
if (__DEV__) {
  var emitter = new _NativeEventEmitter.default(_Platform.default.OS !== 'ios' ? null : _NativeDevSettings.default);
  var subscriptions = new Map();
  DevSettings = {
    addMenuItem: function addMenuItem(title, handler) {
      var subscription = subscriptions.get(title);
      if (subscription != null) {
        subscription.remove();
      } else {
        _NativeDevSettings.default.addMenuItem(title);
      }
      subscription = emitter.addListener('didPressMenuItem', function (event) {
        if (event.title === title) {
          handler();
        }
      });
      subscriptions.set(title, subscription);
    },
    reload: function reload(reason) {
      if (_NativeDevSettings.default.reloadWithReason != null) {
        _NativeDevSettings.default.reloadWithReason(reason != null ? reason : 'Uncategorized from JS');
      } else {
        _NativeDevSettings.default.reload();
      }
    },
    onFastRefresh: function onFastRefresh() {
      _NativeDevSettings.default.onFastRefresh == null ? void 0 : _NativeDevSettings.default.onFastRefresh();
    }
  };
}
module.exports = DevSettings;