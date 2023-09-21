Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DynamicColorIOS = void 0;
var _PlatformColorValueTypes = require("./PlatformColorValueTypes");
var DynamicColorIOS = function DynamicColorIOS(tuple) {
  return (0, _PlatformColorValueTypes.DynamicColorIOSPrivate)({
    light: tuple.light,
    dark: tuple.dark,
    highContrastLight: tuple.highContrastLight,
    highContrastDark: tuple.highContrastDark
  });
};
exports.DynamicColorIOS = DynamicColorIOS;