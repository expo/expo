var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var ReactNativeStartupTiming = function () {
  function ReactNativeStartupTiming(startUpTiming) {
    (0, _classCallCheck2.default)(this, ReactNativeStartupTiming);
    this._startTime = 0;
    this._endTime = 0;
    this._executeJavaScriptBundleEntryPointStart = 0;
    this._executeJavaScriptBundleEntryPointEnd = 0;
    if (startUpTiming != null) {
      this._startTime = startUpTiming.startTime;
      this._endTime = startUpTiming.endTime;
      this._executeJavaScriptBundleEntryPointStart = startUpTiming.executeJavaScriptBundleEntryPointStart;
      this._executeJavaScriptBundleEntryPointEnd = startUpTiming.executeJavaScriptBundleEntryPointEnd;
    }
  }
  (0, _createClass2.default)(ReactNativeStartupTiming, [{
    key: "startTime",
    get: function get() {
      return this._startTime;
    }
  }, {
    key: "endTime",
    get: function get() {
      return this._endTime;
    }
  }, {
    key: "executeJavaScriptBundleEntryPointStart",
    get: function get() {
      return this._executeJavaScriptBundleEntryPointStart;
    }
  }, {
    key: "executeJavaScriptBundleEntryPointEnd",
    get: function get() {
      return this._executeJavaScriptBundleEntryPointEnd;
    }
  }]);
  return ReactNativeStartupTiming;
}();
exports.default = ReactNativeStartupTiming;