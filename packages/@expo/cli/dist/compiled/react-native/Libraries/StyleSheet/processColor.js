'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var Platform = require('../Utilities/Platform');
var normalizeColor = require('./normalizeColor');
function processColor(color) {
  if (color === undefined || color === null) {
    return color;
  }
  var normalizedColor = normalizeColor(color);
  if (normalizedColor === null || normalizedColor === undefined) {
    return undefined;
  }
  if (typeof normalizedColor === 'object') {
    var processColorObject = require('./PlatformColorValueTypes').processColorObject;
    var processedColorObj = processColorObject(normalizedColor);
    if (processedColorObj != null) {
      return processedColorObj;
    }
  }
  if (typeof normalizedColor !== 'number') {
    return null;
  }
  normalizedColor = (normalizedColor << 24 | normalizedColor >>> 8) >>> 0;
  if (Platform.OS === 'android') {
    normalizedColor = normalizedColor | 0x0;
  }
  return normalizedColor;
}
var _default = processColor;
exports.default = _default;
//# sourceMappingURL=processColor.js.map