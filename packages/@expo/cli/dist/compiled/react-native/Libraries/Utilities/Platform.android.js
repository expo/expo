var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativePlatformConstantsAndroid = _interopRequireDefault(require("./NativePlatformConstantsAndroid"));
var Platform = {
  __constants: null,
  OS: 'android',
  get Version() {
    return this.constants.Version;
  },
  get constants() {
    if (this.__constants == null) {
      this.__constants = _NativePlatformConstantsAndroid.default.getConstants();
    }
    return this.__constants;
  },
  get isTesting() {
    if (__DEV__) {
      return this.constants.isTesting;
    }
    return false;
  },
  get isTV() {
    return this.constants.uiMode === 'tv';
  },
  select: function select(spec) {
    return 'android' in spec ? spec.android : 'native' in spec ? spec.native : spec.default;
  }
};
module.exports = Platform;
//# sourceMappingURL=Platform.android.js.map