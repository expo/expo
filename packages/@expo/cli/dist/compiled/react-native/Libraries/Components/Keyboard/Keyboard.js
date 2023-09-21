var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativeEventEmitter = _interopRequireDefault(require("../../EventEmitter/NativeEventEmitter"));
var _LayoutAnimation = _interopRequireDefault(require("../../LayoutAnimation/LayoutAnimation"));
var _dismissKeyboard = _interopRequireDefault(require("../../Utilities/dismissKeyboard"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _NativeKeyboardObserver = _interopRequireDefault(require("./NativeKeyboardObserver"));
var Keyboard = function () {
  function Keyboard() {
    var _this = this;
    (0, _classCallCheck2.default)(this, Keyboard);
    this._emitter = new _NativeEventEmitter.default(_Platform.default.OS !== 'ios' ? null : _NativeKeyboardObserver.default);
    this.addListener('keyboardDidShow', function (ev) {
      _this._currentlyShowing = ev;
    });
    this.addListener('keyboardDidHide', function (_ev) {
      _this._currentlyShowing = null;
    });
  }
  (0, _createClass2.default)(Keyboard, [{
    key: "addListener",
    value: function addListener(eventType, listener, context) {
      return this._emitter.addListener(eventType, listener);
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners(eventType) {
      this._emitter.removeAllListeners(eventType);
    }
  }, {
    key: "dismiss",
    value: function dismiss() {
      (0, _dismissKeyboard.default)();
    }
  }, {
    key: "isVisible",
    value: function isVisible() {
      return !!this._currentlyShowing;
    }
  }, {
    key: "metrics",
    value: function metrics() {
      var _this$_currentlyShowi;
      return (_this$_currentlyShowi = this._currentlyShowing) == null ? void 0 : _this$_currentlyShowi.endCoordinates;
    }
  }, {
    key: "scheduleLayoutAnimation",
    value: function scheduleLayoutAnimation(event) {
      var duration = event.duration,
        easing = event.easing;
      if (duration != null && duration !== 0) {
        _LayoutAnimation.default.configureNext({
          duration: duration,
          update: {
            duration: duration,
            type: easing != null && _LayoutAnimation.default.Types[easing] || 'keyboard'
          }
        });
      }
    }
  }]);
  return Keyboard;
}();
module.exports = new Keyboard();