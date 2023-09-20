var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _ReactNativeFeatureFlags = _interopRequireDefault(require("../ReactNative/ReactNativeFeatureFlags"));
var _NativePerformance = _interopRequireDefault(require("../WebPerformance/NativePerformance"));
var _createPerformanceLogger = _interopRequireDefault(require("./createPerformanceLogger"));
function isLoggingForWebPerformance() {
  return _NativePerformance.default != null && _ReactNativeFeatureFlags.default.isGlobalWebPerformanceLoggerEnabled();
}
var GlobalPerformanceLogger = (0, _createPerformanceLogger.default)(isLoggingForWebPerformance());
module.exports = GlobalPerformanceLogger;
//# sourceMappingURL=GlobalPerformanceLogger.js.map