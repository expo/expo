"use strict";

exports.__esModule = true;
var _foo = require("foo");
Object.keys(_foo).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _foo[key]) return;
  exports[key] = _foo[key];
});
