"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Screen = exports.Group = void 0;
function _core() {
  const data = require("@react-navigation/core");
  _core = function () {
    return data;
  };
  return data;
}
// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const {
  Screen,
  Group
} = (0, _core().createNavigatorFactory)({})();
exports.Group = Group;
exports.Screen = Screen;
//# sourceMappingURL=primitives.js.map