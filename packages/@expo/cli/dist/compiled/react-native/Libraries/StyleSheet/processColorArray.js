'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _processColor = _interopRequireDefault(require("./processColor"));
var TRANSPARENT = 0;
function processColorArray(colors) {
  return colors == null ? null : colors.map(processColorElement);
}
function processColorElement(color) {
  var value = (0, _processColor.default)(color);
  if (value == null) {
    console.error('Invalid value in color array:', color);
    return TRANSPARENT;
  }
  return value;
}
module.exports = processColorArray;
//# sourceMappingURL=processColorArray.js.map