Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processColorObject = exports.normalizeColorObject = exports.PlatformColor = exports.DynamicColorIOSPrivate = void 0;
var PlatformColor = function PlatformColor() {
  for (var _len = arguments.length, names = new Array(_len), _key = 0; _key < _len; _key++) {
    names[_key] = arguments[_key];
  }
  return {
    semantic: names
  };
};
exports.PlatformColor = PlatformColor;
var DynamicColorIOSPrivate = function DynamicColorIOSPrivate(tuple) {
  return {
    dynamic: {
      light: tuple.light,
      dark: tuple.dark,
      highContrastLight: tuple.highContrastLight,
      highContrastDark: tuple.highContrastDark
    }
  };
};
exports.DynamicColorIOSPrivate = DynamicColorIOSPrivate;
var normalizeColorObject = function normalizeColorObject(color) {
  if ('semantic' in color) {
    return color;
  } else if ('dynamic' in color && color.dynamic !== undefined) {
    var normalizeColor = require('./normalizeColor');
    var dynamic = color.dynamic;
    var dynamicColor = {
      dynamic: {
        light: normalizeColor(dynamic.light),
        dark: normalizeColor(dynamic.dark),
        highContrastLight: normalizeColor(dynamic.highContrastLight),
        highContrastDark: normalizeColor(dynamic.highContrastDark)
      }
    };
    return dynamicColor;
  }
  return null;
};
exports.normalizeColorObject = normalizeColorObject;
var processColorObject = function processColorObject(color) {
  if ('dynamic' in color && color.dynamic != null) {
    var processColor = require('./processColor').default;
    var dynamic = color.dynamic;
    var dynamicColor = {
      dynamic: {
        light: processColor(dynamic.light),
        dark: processColor(dynamic.dark),
        highContrastLight: processColor(dynamic.highContrastLight),
        highContrastDark: processColor(dynamic.highContrastDark)
      }
    };
    return dynamicColor;
  }
  return color;
};
exports.processColorObject = processColorObject;