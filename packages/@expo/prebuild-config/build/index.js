"use strict";

exports.__esModule = true;
var _exportNames = {
  getPrebuildConfigAsync: true
};
exports.getPrebuildConfigAsync = void 0;
function _getPrebuildConfig() {
  const data = require("./getPrebuildConfig");
  _getPrebuildConfig = function () {
    return data;
  };
  return data;
}
exports.getPrebuildConfigAsync = _getPrebuildConfig().getPrebuildConfigAsync;
var _withDefaultPlugins = require("./plugins/withDefaultPlugins");
Object.keys(_withDefaultPlugins).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _withDefaultPlugins[key]) return;
  exports[key] = _withDefaultPlugins[key];
});
//# sourceMappingURL=index.js.map