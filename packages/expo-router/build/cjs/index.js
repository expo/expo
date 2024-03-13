"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  Stack: true,
  Tabs: true
};
Object.defineProperty(exports, "Stack", {
  enumerable: true,
  get: function () {
    return _Stack().Stack;
  }
});
Object.defineProperty(exports, "Tabs", {
  enumerable: true,
  get: function () {
    return _Tabs().Tabs;
  }
});
function _Stack() {
  const data = require("./layouts/Stack");
  _Stack = function () {
    return data;
  };
  return data;
}
function _Tabs() {
  const data = require("./layouts/Tabs");
  _Tabs = function () {
    return data;
  };
  return data;
}
var _exports = require("./exports");
Object.keys(_exports).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _exports[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _exports[key];
    }
  });
});
//# sourceMappingURL=index.js.map