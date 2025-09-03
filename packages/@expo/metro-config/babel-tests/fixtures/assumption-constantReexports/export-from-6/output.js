"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _foo = require("foo");
Object.keys(_foo).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _foo[key]) return;
  exports[key] = _foo[key];
});
