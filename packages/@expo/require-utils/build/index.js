"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _load = require("./load");
Object.keys(_load).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _load[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _load[key];
    }
  });
});
var _resolve = require("./resolve");
Object.keys(_resolve).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _resolve[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _resolve[key];
    }
  });
});
//# sourceMappingURL=index.js.map