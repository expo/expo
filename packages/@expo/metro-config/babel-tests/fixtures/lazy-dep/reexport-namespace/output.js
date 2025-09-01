"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.namespace = void 0;
function namespace() {
  const data = babelHelpers.interopRequireWildcard(require("foo"));
  namespace = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "namespace", {
  enumerable: true,
  get: function () {
    return namespace();
  }
});
