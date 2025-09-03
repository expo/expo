"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "named", {
  enumerable: true,
  get: function () {
    return _foo().named;
  }
});
function _foo() {
  const data = require("foo");
  _foo = function () {
    return data;
  };
  return data;
}
