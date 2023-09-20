var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeToastAndroid = _interopRequireDefault(require("./NativeToastAndroid"));
var ToastAndroidConstants = _NativeToastAndroid.default.getConstants();
var ToastAndroid = {
  SHORT: ToastAndroidConstants.SHORT,
  LONG: ToastAndroidConstants.LONG,
  TOP: ToastAndroidConstants.TOP,
  BOTTOM: ToastAndroidConstants.BOTTOM,
  CENTER: ToastAndroidConstants.CENTER,
  show: function show(message, duration) {
    _NativeToastAndroid.default.show(message, duration);
  },
  showWithGravity: function showWithGravity(message, duration, gravity) {
    _NativeToastAndroid.default.showWithGravity(message, duration, gravity);
  },
  showWithGravityAndOffset: function showWithGravityAndOffset(message, duration, gravity, xOffset, yOffset) {
    _NativeToastAndroid.default.showWithGravityAndOffset(message, duration, gravity, xOffset, yOffset);
  }
};
module.exports = ToastAndroid;
//# sourceMappingURL=ToastAndroid.android.js.map