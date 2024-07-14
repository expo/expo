"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _codeMod = require("../apple/codeMod");
Object.keys(_codeMod).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _codeMod[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _codeMod[key];
    }
  });
});
//# sourceMappingURL=codeMod.js.map