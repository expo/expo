"use strict";

exports.__esModule = true;
var _load = require("./load");
Object.keys(_load).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _load[key]) return;
  exports[key] = _load[key];
});
var _resolve = require("./resolve");
Object.keys(_resolve).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _resolve[key]) return;
  exports[key] = _resolve[key];
});
var _resolveGlobal = require("./resolveGlobal");
Object.keys(_resolveGlobal).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _resolveGlobal[key]) return;
  exports[key] = _resolveGlobal[key];
});
//# sourceMappingURL=index.js.map