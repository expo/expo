var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativePerformance = _interopRequireDefault(require("../WebPerformance/NativePerformance"));
var _Performance = _interopRequireDefault(require("../WebPerformance/Performance"));
if (_NativePerformance.default) {
  global.performance = new _Performance.default();
} else {
  if (!global.performance) {
    global.performance = {};
  }
  if (typeof global.performance.now !== 'function') {
    global.performance.now = function () {
      var performanceNow = global.nativePerformanceNow || Date.now;
      return performanceNow();
    };
  }
}
//# sourceMappingURL=setUpPerformance.js.map