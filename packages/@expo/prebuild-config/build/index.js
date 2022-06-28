"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  getPrebuildConfigAsync: true
};
Object.defineProperty(exports, "getPrebuildConfigAsync", {
  enumerable: true,
  get: function () {
    return _getPrebuildConfig().getPrebuildConfigAsync;
  }
});

function _getPrebuildConfig() {
  const data = require("./getPrebuildConfig");

  _getPrebuildConfig = function () {
    return data;
  };

  return data;
}

var _withDefaultPlugins = require("./plugins/withDefaultPlugins");

Object.keys(_withDefaultPlugins).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _withDefaultPlugins[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _withDefaultPlugins[key];
    }
  });
});
//# sourceMappingURL=index.js.map