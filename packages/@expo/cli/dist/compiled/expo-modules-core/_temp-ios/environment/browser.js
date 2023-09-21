Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isDOMAvailable = exports.isAsyncDebugging = exports.canUseViewport = exports.canUseEventListeners = void 0;
var isDOMAvailable = false;
exports.isDOMAvailable = isDOMAvailable;
var canUseEventListeners = false;
exports.canUseEventListeners = canUseEventListeners;
var canUseViewport = false;
exports.canUseViewport = canUseViewport;
var isAsyncDebugging = false;
exports.isAsyncDebugging = isAsyncDebugging;
if (__DEV__) {
  exports.isAsyncDebugging = isAsyncDebugging = !global.nativeExtensions && !global.nativeCallSyncHook && !global.RN$Bridgeless;
}