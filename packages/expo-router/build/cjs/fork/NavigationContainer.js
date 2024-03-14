"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
    return data;
  };
  return data;
}
// We only need to fork on native to support any prefixes.
var _default = exports.default = _native().NavigationContainer;
//# sourceMappingURL=NavigationContainer.js.map