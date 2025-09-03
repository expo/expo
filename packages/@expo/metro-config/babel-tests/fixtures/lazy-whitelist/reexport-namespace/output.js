"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.namespace2 = exports.namespace1 = void 0;
function namespace1() {
  const data = babelHelpers.interopRequireWildcard(require("white"));
  namespace1 = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "namespace1", {
  enumerable: true,
  get: function () {
    return namespace1();
  }
});
var namespace2 = babelHelpers.interopRequireWildcard(require("black"));
exports.namespace2 = namespace2;
