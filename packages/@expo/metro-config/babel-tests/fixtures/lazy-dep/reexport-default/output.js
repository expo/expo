"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "default", {
  enumerable: true,
  get: function () {
    return _foo().default;
  }
});
function _foo() {
  const data = babelHelpers.interopRequireDefault(require("foo"));
  _foo = function () {
    return data;
  };
  return data;
}
