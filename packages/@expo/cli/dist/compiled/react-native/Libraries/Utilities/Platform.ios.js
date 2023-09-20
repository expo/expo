var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativePlatformConstantsIOS = _interopRequireDefault(require("./NativePlatformConstantsIOS"));
var Platform = {
  __constants: null,
  OS: 'ios',
  get Version() {
    return this.constants.osVersion;
  },
  get constants() {
    if (this.__constants == null) {
      this.__constants = _NativePlatformConstantsIOS.default.getConstants();
    }
    return this.__constants;
  },
  get isPad() {
    return this.constants.interfaceIdiom === 'pad';
  },
  get isTV() {
    return this.constants.interfaceIdiom === 'tv';
  },
  get isTesting() {
    if (__DEV__) {
      return this.constants.isTesting;
    }
    return false;
  },
  select: function select(spec) {
    return 'ios' in spec ? spec.ios : 'native' in spec ? spec.native : spec.default;
  }
};
module.exports = Platform;
//# sourceMappingURL=Platform.ios.js.map