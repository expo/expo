"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {};
exports.default = void 0;
var _react = babelHelpers.interopRequireWildcard(require("react"));
Object.keys(_react).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _react[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _react[key];
    }
  });
});
// The fact that this exports both a normal default, and all of the names via
// re-export is an edge case that is important not to miss. See
// https://github.com/babel/babel/issues/8306 as an example.
var _default2 = exports.default = _react.default;
