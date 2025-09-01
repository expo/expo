"use strict";

function _white() {
  const data = babelHelpers.interopRequireDefault(require("white"));
  _white = function () {
    return data;
  };
  return data;
}
var _black = babelHelpers.interopRequireDefault(require("black"));
console.log(_white().default);
console.log(_black.default);
