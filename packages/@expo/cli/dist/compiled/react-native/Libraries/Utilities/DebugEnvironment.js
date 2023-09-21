Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isAsyncDebugging = void 0;
var isAsyncDebugging = false;
exports.isAsyncDebugging = isAsyncDebugging;
if (__DEV__) {
  exports.isAsyncDebugging = isAsyncDebugging = !global.nativeExtensions && !global.nativeCallSyncHook && !global.RN$Bridgeless;
}