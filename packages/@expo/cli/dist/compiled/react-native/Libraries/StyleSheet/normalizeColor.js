var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _normalizeColors = _interopRequireDefault(require("@react-native/normalize-colors"));
function normalizeColor(color) {
  if (typeof color === 'object' && color != null) {
    var _require = require("./PlatformColorValueTypes"),
      normalizeColorObject = _require.normalizeColorObject;
    var normalizedColor = normalizeColorObject(color);
    if (normalizedColor != null) {
      return normalizedColor;
    }
  }
  if (typeof color === 'string' || typeof color === 'number') {
    return (0, _normalizeColors.default)(color);
  }
}
module.exports = normalizeColor;
//# sourceMappingURL=normalizeColor.js.map