var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeFrameRateLogger = _interopRequireDefault(require("./NativeFrameRateLogger"));
var invariant = require('invariant');
var FrameRateLogger = {
  setGlobalOptions: function setGlobalOptions(options) {
    if (options.debug !== undefined) {
      invariant(_NativeFrameRateLogger.default, 'Trying to debug FrameRateLogger without the native module!');
    }
    if (_NativeFrameRateLogger.default) {
      var optionsClone = {
        debug: !!options.debug,
        reportStackTraces: !!options.reportStackTraces
      };
      _NativeFrameRateLogger.default.setGlobalOptions(optionsClone);
    }
  },
  setContext: function setContext(context) {
    _NativeFrameRateLogger.default && _NativeFrameRateLogger.default.setContext(context);
  },
  beginScroll: function beginScroll() {
    _NativeFrameRateLogger.default && _NativeFrameRateLogger.default.beginScroll();
  },
  endScroll: function endScroll() {
    _NativeFrameRateLogger.default && _NativeFrameRateLogger.default.endScroll();
  }
};
module.exports = FrameRateLogger;
//# sourceMappingURL=FrameRateLogger.js.map