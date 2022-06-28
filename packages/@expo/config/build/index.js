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
    return _getFullName().getAccountUsername;
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

var _Project = require("./Project");

Object.keys(_Project).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Project[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Project[key];
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

function _getFullName() {
  const data = require("./getFullName");

  _getFullName = function () {
    return data;
  };

  return data;
}
//# sourceMappingURL=index.js.map