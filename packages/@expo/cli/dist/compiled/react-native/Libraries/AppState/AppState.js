var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativeEventEmitter = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _logError = _interopRequireDefault(require("../Utilities/logError"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _NativeAppState = _interopRequireDefault(require("./NativeAppState"));
var AppState = function () {
  function AppState() {
    var _this = this;
    (0, _classCallCheck2.default)(this, AppState);
    this.currentState = null;
    if (_NativeAppState.default == null) {
      this.isAvailable = false;
    } else {
      this.isAvailable = true;
      var emitter = new _NativeEventEmitter.default(_Platform.default.OS !== 'ios' ? null : _NativeAppState.default);
      this._emitter = emitter;
      this.currentState = _NativeAppState.default.getConstants().initialAppState;
      var eventUpdated = false;
      emitter.addListener('appStateDidChange', function (appStateData) {
        eventUpdated = true;
        _this.currentState = appStateData.app_state;
      });
      _NativeAppState.default.getCurrentAppState(function (appStateData) {
        if (!eventUpdated && _this.currentState !== appStateData.app_state) {
          _this.currentState = appStateData.app_state;
          emitter.emit('appStateDidChange', appStateData);
        }
      }, _logError.default);
    }
  }
  (0, _createClass2.default)(AppState, [{
    key: "addEventListener",
    value: function addEventListener(type, handler) {
      var emitter = this._emitter;
      if (emitter == null) {
        throw new Error('Cannot use AppState when `isAvailable` is false.');
      }
      switch (type) {
        case 'change':
          var changeHandler = handler;
          return emitter.addListener('appStateDidChange', function (appStateData) {
            changeHandler(appStateData.app_state);
          });
        case 'memoryWarning':
          var memoryWarningHandler = handler;
          return emitter.addListener('memoryWarning', memoryWarningHandler);
        case 'blur':
        case 'focus':
          var focusOrBlurHandler = handler;
          return emitter.addListener('appStateFocusChange', function (hasFocus) {
            if (type === 'blur' && !hasFocus) {
              focusOrBlurHandler();
            }
            if (type === 'focus' && hasFocus) {
              focusOrBlurHandler();
            }
          });
      }
      throw new Error('Trying to subscribe to unknown event: ' + type);
    }
  }]);
  return AppState;
}();
module.exports = new AppState();
//# sourceMappingURL=AppState.js.map