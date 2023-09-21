var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EventEmitter = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _invariant = _interopRequireDefault(require("invariant"));
var _reactNative = require("react-native");
var nativeEmitterSubscriptionKey = '@@nativeEmitterSubscription@@';
var EventEmitter = function () {
  function EventEmitter(nativeModule) {
    (0, _classCallCheck2.default)(this, EventEmitter);
    this._listenerCount = 0;
    if (nativeModule.__expo_module_name__ && _reactNative.NativeModules.EXReactNativeEventEmitter) {
      nativeModule.addListener = function () {
        var _NativeModules$EXReac;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        return (_NativeModules$EXReac = _reactNative.NativeModules.EXReactNativeEventEmitter).addProxiedListener.apply(_NativeModules$EXReac, [nativeModule.__expo_module_name__].concat(args));
      };
      nativeModule.removeListeners = function () {
        var _NativeModules$EXReac2;
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        return (_NativeModules$EXReac2 = _reactNative.NativeModules.EXReactNativeEventEmitter).removeProxiedListeners.apply(_NativeModules$EXReac2, [nativeModule.__expo_module_name__].concat(args));
      };
    }
    this._nativeModule = nativeModule;
    this._eventEmitter = new _reactNative.NativeEventEmitter(nativeModule);
  }
  (0, _createClass2.default)(EventEmitter, [{
    key: "addListener",
    value: function addListener(eventName, listener) {
      var _this = this,
        _subscription;
      if (!this._listenerCount && _reactNative.Platform.OS !== 'ios' && this._nativeModule.startObserving) {
        this._nativeModule.startObserving();
      }
      this._listenerCount++;
      var nativeEmitterSubscription = this._eventEmitter.addListener(eventName, listener);
      var subscription = (_subscription = {}, (0, _defineProperty2.default)(_subscription, nativeEmitterSubscriptionKey, nativeEmitterSubscription), (0, _defineProperty2.default)(_subscription, "remove", function remove() {
        _this.removeSubscription(subscription);
      }), _subscription);
      return subscription;
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners(eventName) {
      var removedListenerCount = this._eventEmitter.listenerCount ? this._eventEmitter.listenerCount(eventName) : this._eventEmitter.listeners(eventName).length;
      this._eventEmitter.removeAllListeners(eventName);
      this._listenerCount -= removedListenerCount;
      (0, _invariant.default)(this._listenerCount >= 0, `EventEmitter must have a non-negative number of listeners`);
      if (!this._listenerCount && _reactNative.Platform.OS !== 'ios' && this._nativeModule.stopObserving) {
        this._nativeModule.stopObserving();
      }
    }
  }, {
    key: "removeSubscription",
    value: function removeSubscription(subscription) {
      var nativeEmitterSubscription = subscription[nativeEmitterSubscriptionKey];
      if (!nativeEmitterSubscription) {
        return;
      }
      if ('remove' in nativeEmitterSubscription) {
        nativeEmitterSubscription.remove();
      } else if ('removeSubscription' in this._eventEmitter) {
        this._eventEmitter.removeSubscription(nativeEmitterSubscription);
      }
      this._listenerCount--;
      delete subscription[nativeEmitterSubscriptionKey];
      subscription.remove = function () {};
      if (!this._listenerCount && _reactNative.Platform.OS !== 'ios' && this._nativeModule.stopObserving) {
        this._nativeModule.stopObserving();
      }
    }
  }, {
    key: "emit",
    value: function emit(eventName) {
      var _this$_eventEmitter;
      for (var _len3 = arguments.length, params = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        params[_key3 - 1] = arguments[_key3];
      }
      (_this$_eventEmitter = this._eventEmitter).emit.apply(_this$_eventEmitter, [eventName].concat(params));
    }
  }]);
  return EventEmitter;
}();
exports.EventEmitter = EventEmitter;