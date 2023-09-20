var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeI18nManager = _interopRequireDefault(require("./NativeI18nManager"));
var i18nConstants = getI18nManagerConstants();
function getI18nManagerConstants() {
  if (_NativeI18nManager.default) {
    var _NativeI18nManager$ge = _NativeI18nManager.default.getConstants(),
      isRTL = _NativeI18nManager$ge.isRTL,
      doLeftAndRightSwapInRTL = _NativeI18nManager$ge.doLeftAndRightSwapInRTL,
      localeIdentifier = _NativeI18nManager$ge.localeIdentifier;
    return {
      isRTL: isRTL,
      doLeftAndRightSwapInRTL: doLeftAndRightSwapInRTL,
      localeIdentifier: localeIdentifier
    };
  }
  return {
    isRTL: false,
    doLeftAndRightSwapInRTL: true
  };
}
module.exports = {
  getConstants: function getConstants() {
    return i18nConstants;
  },
  allowRTL: function allowRTL(shouldAllow) {
    if (!_NativeI18nManager.default) {
      return;
    }
    _NativeI18nManager.default.allowRTL(shouldAllow);
  },
  forceRTL: function forceRTL(shouldForce) {
    if (!_NativeI18nManager.default) {
      return;
    }
    _NativeI18nManager.default.forceRTL(shouldForce);
  },
  swapLeftAndRightInRTL: function swapLeftAndRightInRTL(flipStyles) {
    if (!_NativeI18nManager.default) {
      return;
    }
    _NativeI18nManager.default.swapLeftAndRightInRTL(flipStyles);
  },
  isRTL: i18nConstants.isRTL,
  doLeftAndRightSwapInRTL: i18nConstants.doLeftAndRightSwapInRTL
};
//# sourceMappingURL=I18nManager.js.map