"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _paths = require("./paths");

Object.keys(_paths).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _paths[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _paths[key];
    }
  });
});

var _extensions = require("./extensions");

Object.keys(_extensions).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _extensions[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _extensions[key];
    }
  });
});
//# sourceMappingURL=index.js.map