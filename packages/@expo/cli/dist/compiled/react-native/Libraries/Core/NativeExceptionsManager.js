Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var TurboModuleRegistry = _interopRequireWildcard(require("../TurboModule/TurboModuleRegistry"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var Platform = require('../Utilities/Platform');
var NativeModule = TurboModuleRegistry.getEnforcing('ExceptionsManager');
var ExceptionsManager = {
  reportFatalException: function reportFatalException(message, stack, exceptionId) {
    NativeModule.reportFatalException(message, stack, exceptionId);
  },
  reportSoftException: function reportSoftException(message, stack, exceptionId) {
    NativeModule.reportSoftException(message, stack, exceptionId);
  },
  updateExceptionMessage: function updateExceptionMessage(message, stack, exceptionId) {
    NativeModule.updateExceptionMessage(message, stack, exceptionId);
  },
  dismissRedbox: function dismissRedbox() {
    if (Platform.OS !== 'ios' && NativeModule.dismissRedbox) {
      NativeModule.dismissRedbox();
    }
  },
  reportException: function reportException(data) {
    if (NativeModule.reportException) {
      NativeModule.reportException(data);
      return;
    }
    if (data.isFatal) {
      ExceptionsManager.reportFatalException(data.message, data.stack, data.id);
    } else {
      ExceptionsManager.reportSoftException(data.message, data.stack, data.id);
    }
  }
};
var _default = ExceptionsManager;
exports.default = _default;
//# sourceMappingURL=NativeExceptionsManager.js.map