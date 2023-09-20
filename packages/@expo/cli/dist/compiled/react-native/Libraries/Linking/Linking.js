var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _NativeEventEmitter2 = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _NativeIntentAndroid = _interopRequireDefault(require("./NativeIntentAndroid"));
var _NativeLinkingManager = _interopRequireDefault(require("./NativeLinkingManager"));
var _invariant = _interopRequireDefault(require("invariant"));
var _nullthrows = _interopRequireDefault(require("nullthrows"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var Linking = function (_NativeEventEmitter) {
  (0, _inherits2.default)(Linking, _NativeEventEmitter);
  var _super = _createSuper(Linking);
  function Linking() {
    (0, _classCallCheck2.default)(this, Linking);
    return _super.call(this, _Platform.default.OS === 'ios' ? (0, _nullthrows.default)(_NativeLinkingManager.default) : undefined);
  }
  (0, _createClass2.default)(Linking, [{
    key: "addEventListener",
    value: function addEventListener(eventType, listener, context) {
      return this.addListener(eventType, listener);
    }
  }, {
    key: "openURL",
    value: function openURL(url) {
      this._validateURL(url);
      if (_Platform.default.OS === 'android') {
        return (0, _nullthrows.default)(_NativeIntentAndroid.default).openURL(url);
      } else {
        return (0, _nullthrows.default)(_NativeLinkingManager.default).openURL(url);
      }
    }
  }, {
    key: "canOpenURL",
    value: function canOpenURL(url) {
      this._validateURL(url);
      if (_Platform.default.OS === 'android') {
        return (0, _nullthrows.default)(_NativeIntentAndroid.default).canOpenURL(url);
      } else {
        return (0, _nullthrows.default)(_NativeLinkingManager.default).canOpenURL(url);
      }
    }
  }, {
    key: "openSettings",
    value: function openSettings() {
      if (_Platform.default.OS === 'android') {
        return (0, _nullthrows.default)(_NativeIntentAndroid.default).openSettings();
      } else {
        return (0, _nullthrows.default)(_NativeLinkingManager.default).openSettings();
      }
    }
  }, {
    key: "getInitialURL",
    value: function getInitialURL() {
      return _Platform.default.OS === 'android' ? (0, _nullthrows.default)(_NativeIntentAndroid.default).getInitialURL() : (0, _nullthrows.default)(_NativeLinkingManager.default).getInitialURL();
    }
  }, {
    key: "sendIntent",
    value: function sendIntent(action, extras) {
      if (_Platform.default.OS === 'android') {
        return (0, _nullthrows.default)(_NativeIntentAndroid.default).sendIntent(action, extras);
      } else {
        return new Promise(function (resolve, reject) {
          return reject(new Error('Unsupported'));
        });
      }
    }
  }, {
    key: "_validateURL",
    value: function _validateURL(url) {
      (0, _invariant.default)(typeof url === 'string', 'Invalid URL: should be a string. Was: ' + url);
      (0, _invariant.default)(url, 'Invalid URL: cannot be empty');
    }
  }]);
  return Linking;
}(_NativeEventEmitter2.default);
module.exports = new Linking();
//# sourceMappingURL=Linking.js.map