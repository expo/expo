"use strict";

function _foo() {
  const data = babelHelpers.interopRequireDefault(require("foo"));
  _foo = function () {
    return data;
  };
  return data;
}
console.log(_foo().default);
