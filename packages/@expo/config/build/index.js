"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  getAccountUsername: true
};
Object.defineProperty(exports, "getAccountUsername", {
  enumerable: true,
  get: function () {
    return _getAccountUsername().getAccountUsername;
  }
});
var _Config = require("./Config");
Object.keys(_Config).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Config[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Config[key];
    }
  });
});
var _Config2 = require("./Config.types");
Object.keys(_Config2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Config2[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Config2[key];
    }
  });
});
var _getExpoSDKVersion = require("./getExpoSDKVersion");
Object.keys(_getExpoSDKVersion).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _getExpoSDKVersion[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _getExpoSDKVersion[key];
    }
  });
});
var _Errors = require("./Errors");
Object.keys(_Errors).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Errors[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Errors[key];
    }
  });
});
function _getAccountUsername() {
  const data = require("./getAccountUsername");
  _getAccountUsername = function () {
    return data;
  };
  return data;
}
//# sourceMappingURL=index.js.map