"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _AppleConfig = require("../apple/AppleConfig.types");
Object.keys(_AppleConfig).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _AppleConfig[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _AppleConfig[key];
    }
  });
});
//# sourceMappingURL=IosConfig.types.js.map