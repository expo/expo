"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _white = require("white");
Object.keys(_white).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _white[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _white[key];
    }
  });
});
var _black = require("black");
Object.keys(_black).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _black[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _black[key];
    }
  });
});
