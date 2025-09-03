"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "named1", {
  enumerable: true,
  get: function () {
    return _white().named1;
  }
});
Object.defineProperty(exports, "named2", {
  enumerable: true,
  get: function () {
    return _black.named2;
  }
});
function _white() {
  const data = require("white");
  _white = function () {
    return data;
  };
  return data;
}
var _black = require("black");
