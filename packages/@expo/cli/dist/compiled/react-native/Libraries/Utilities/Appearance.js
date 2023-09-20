var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeEventEmitter = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _EventEmitter = _interopRequireDefault(require("../vendor/emitter/EventEmitter"));
var _DebugEnvironment = require("./DebugEnvironment");
var _NativeAppearance = _interopRequireDefault(require("./NativeAppearance"));
var _invariant = _interopRequireDefault(require("invariant"));
var eventEmitter = new _EventEmitter.default();
if (_NativeAppearance.default) {
  var nativeEventEmitter = new _NativeEventEmitter.default(_Platform.default.OS !== 'ios' ? null : _NativeAppearance.default);
  nativeEventEmitter.addListener('appearanceChanged', function (newAppearance) {
    var colorScheme = newAppearance.colorScheme;
    (0, _invariant.default)(colorScheme === 'dark' || colorScheme === 'light' || colorScheme == null, "Unrecognized color scheme. Did you mean 'dark' or 'light'?");
    eventEmitter.emit('change', {
      colorScheme: colorScheme
    });
  });
}
module.exports = {
  getColorScheme: function getColorScheme() {
    if (__DEV__) {
      if (_DebugEnvironment.isAsyncDebugging) {
        return 'light';
      }
    }
    var nativeColorScheme = _NativeAppearance.default == null ? null : _NativeAppearance.default.getColorScheme() || null;
    (0, _invariant.default)(nativeColorScheme === 'dark' || nativeColorScheme === 'light' || nativeColorScheme == null, "Unrecognized color scheme. Did you mean 'dark' or 'light'?");
    return nativeColorScheme;
  },
  setColorScheme: function setColorScheme(colorScheme) {
    var nativeColorScheme = colorScheme == null ? 'unspecified' : colorScheme;
    (0, _invariant.default)(colorScheme === 'dark' || colorScheme === 'light' || colorScheme == null, "Unrecognized color scheme. Did you mean 'dark', 'light' or null?");
    if (_NativeAppearance.default != null && _NativeAppearance.default.setColorScheme != null) {
      _NativeAppearance.default.setColorScheme(nativeColorScheme);
    }
  },
  addChangeListener: function addChangeListener(listener) {
    return eventEmitter.addListener('change', listener);
  }
};
//# sourceMappingURL=Appearance.js.map