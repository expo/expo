var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PerformanceEntry = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var PerformanceEntry = function () {
  function PerformanceEntry(init) {
    (0, _classCallCheck2.default)(this, PerformanceEntry);
    this.name = init.name;
    this.entryType = init.entryType;
    this.startTime = init.startTime;
    this.duration = init.duration;
  }
  (0, _createClass2.default)(PerformanceEntry, [{
    key: "toJSON",
    value: function toJSON() {
      return {
        name: this.name,
        entryType: this.entryType,
        startTime: this.startTime,
        duration: this.duration
      };
    }
  }]);
  return PerformanceEntry;
}();
exports.PerformanceEntry = PerformanceEntry;