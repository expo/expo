Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var TurboModuleRegistry = _interopRequireWildcard(require("../../TurboModule/TurboModuleRegistry"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var NativeModule = TurboModuleRegistry.getEnforcing('StatusBarManager');
var constants = null;
var NativeStatusBarManager = {
  getConstants: function getConstants() {
    if (constants == null) {
      constants = NativeModule.getConstants();
    }
    return constants;
  },
  getHeight: function getHeight(callback) {
    NativeModule.getHeight(callback);
  },
  setNetworkActivityIndicatorVisible: function setNetworkActivityIndicatorVisible(visible) {
    NativeModule.setNetworkActivityIndicatorVisible(visible);
  },
  addListener: function addListener(eventType) {
    NativeModule.addListener(eventType);
  },
  removeListeners: function removeListeners(count) {
    NativeModule.removeListeners(count);
  },
  setStyle: function setStyle(statusBarStyle, animated) {
    NativeModule.setStyle(statusBarStyle, animated);
  },
  setHidden: function setHidden(hidden, withAnimation) {
    NativeModule.setHidden(hidden, withAnimation);
  }
};
var _default = NativeStatusBarManager;
exports.default = _default;
//# sourceMappingURL=NativeStatusBarManagerIOS.js.map