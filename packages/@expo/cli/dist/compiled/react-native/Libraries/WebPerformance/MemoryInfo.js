var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var MemoryInfo = function () {
  function MemoryInfo(memoryInfo) {
    (0, _classCallCheck2.default)(this, MemoryInfo);
    if (memoryInfo != null) {
      this._jsHeapSizeLimit = memoryInfo.jsHeapSizeLimit;
      this._totalJSHeapSize = memoryInfo.totalJSHeapSize;
      this._usedJSHeapSize = memoryInfo.usedJSHeapSize;
    }
  }
  (0, _createClass2.default)(MemoryInfo, [{
    key: "jsHeapSizeLimit",
    get: function get() {
      return this._jsHeapSizeLimit;
    }
  }, {
    key: "totalJSHeapSize",
    get: function get() {
      return this._totalJSHeapSize;
    }
  }, {
    key: "usedJSHeapSize",
    get: function get() {
      return this._usedJSHeapSize;
    }
  }]);
  return MemoryInfo;
}();
exports.default = MemoryInfo;