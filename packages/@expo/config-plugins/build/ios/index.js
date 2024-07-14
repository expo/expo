"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _index = require("../apple/index");
Object.keys(_index).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _index[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index[key];
    }
  });
});
//# sourceMappingURL=index.js.map