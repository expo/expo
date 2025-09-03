"use strict";

var _one = babelHelpers.interopRequireDefault(require("one"));
var _two = require("two");
var _three = require("three");
var aNamespace = babelHelpers.interopRequireWildcard(require("four"));
console.log(_one.default);
console.log(_two.aNamed);
console.log(_three.orig);
console.log(aNamespace);
console.log((0, _one.default)());
console.log((0, _two.aNamed)());
console.log((0, _three.orig)());
console.log(aNamespace());
