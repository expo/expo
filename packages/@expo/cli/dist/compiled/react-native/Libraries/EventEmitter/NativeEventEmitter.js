'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _RCTDeviceEventEmitter = _interopRequireDefault(require("./RCTDeviceEventEmitter"));
var _invariant = _interopRequireDefault(require("invariant"));
var NativeEventEmitter = function () {
  function NativeEventEmitter(nativeModule) {
    (0, _classCallCheck2.default)(this, NativeEventEmitter);
    if (_Platform.default.OS === 'ios') {
      (0, _invariant.default)(nativeModule != null, '`new NativeEventEmitter()` requires a non-null argument.');
    }
    var hasAddListener = !!nativeModule && typeof nativeModule.addListener === 'function';
    var hasRemoveListeners = !!nativeModule && typeof nativeModule.removeListeners === 'function';
    if (nativeModule && hasAddListener && hasRemoveListeners) {
      this._nativeModule = nativeModule;
    } else if (nativeModule != null) {
      if (!hasAddListener) {
        console.warn('`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.');
      }
      if (!hasRemoveListeners) {
        console.warn('`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.');
      }
    }
  }
  (0, _createClass2.default)(NativeEventEmitter, [{
    key: "addListener",
    value: function addListener(eventType, listener, context) {
      var _this$_nativeModule,
        _this = this;
      (_this$_nativeModule = this._nativeModule) == null ? void 0 : _this$_nativeModule.addListener(eventType);
      var subscription = _RCTDeviceEventEmitter.default.addListener(eventType, listener, context);
      return {
        remove: function remove() {
          if (subscription != null) {
            var _this$_nativeModule2;
            (_this$_nativeModule2 = _this._nativeModule) == null ? void 0 : _this$_nativeModule2.removeListeners(1);
            subscription.remove();
            subscription = null;
          }
        }
      };
    }
  }, {
    key: "emit",
    value: function emit(eventType) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      _RCTDeviceEventEmitter.default.emit.apply(_RCTDeviceEventEmitter.default, [eventType].concat(args));
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners(eventType) {
      var _this$_nativeModule3;
      (0, _invariant.default)(eventType != null, '`NativeEventEmitter.removeAllListener()` requires a non-null argument.');
      (_this$_nativeModule3 = this._nativeModule) == null ? void 0 : _this$_nativeModule3.removeListeners(this.listenerCount(eventType));
      _RCTDeviceEventEmitter.default.removeAllListeners(eventType);
    }
  }, {
    key: "listenerCount",
    value: function listenerCount(eventType) {
      return _RCTDeviceEventEmitter.default.listenerCount(eventType);
    }
  }]);
  return NativeEventEmitter;
}();
exports.default = NativeEventEmitter;
//# sourceMappingURL=NativeEventEmitter.js.map