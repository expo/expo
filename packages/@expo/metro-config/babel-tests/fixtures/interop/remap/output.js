"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.test = exports.f = exports.e = exports.c = exports.a = void 0;
var _test;
var test = exports.test = 2;
exports.test = test = 5;
_test = test++, exports.test = test, _test;
(function () {
  var test = 2;
  test = 3;
  test++;
})();
var a = exports.a = 2;
exports.a = a = 3;
var b = exports.c = 2;
exports.c = b = 3;
var d = exports.f = exports.e = 3;
exports.f = exports.e = d = 4;
