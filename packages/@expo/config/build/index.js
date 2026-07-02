"use strict";

exports.__esModule = true;
var _Config = require("./Config");
Object.keys(_Config).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Config[key]) return;
  exports[key] = _Config[key];
});
var _Config2 = require("./Config.types");
Object.keys(_Config2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Config2[key]) return;
  exports[key] = _Config2[key];
});
var _getExpoSDKVersion = require("./getExpoSDKVersion");
Object.keys(_getExpoSDKVersion).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _getExpoSDKVersion[key]) return;
  exports[key] = _getExpoSDKVersion[key];
});
var _Errors = require("./Errors");
Object.keys(_Errors).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Errors[key]) return;
  exports[key] = _Errors[key];
});
var _buildCacheProvider = require("./buildCacheProvider");
Object.keys(_buildCacheProvider).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _buildCacheProvider[key]) return;
  exports[key] = _buildCacheProvider[key];
});
//# sourceMappingURL=index.js.map