"use strict";

require("foo");
var _exports = "local exports";
var _module = "local module";
console.log(_exports);
console.log(_exports.prop);
_exports++;
_exports += 4;
({
  exports: _exports
} = {});
[_exports] = [];
_exports = {};
_exports.prop = "";
console.log(_module);
console.log(_module.exports);
_module++;
_module += 4;
({
  module: _module
} = {});
[_module] = [];
_module = {};
_module.prop = "";
