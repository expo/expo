"use strict";

function _matchers() {
  const data = _interopRequireDefault(require("expect/build/matchers"));
  _matchers = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
_matchers().default.customTesters = [];
expect.extend({
  toHavePathname(screen, expected) {
    return _matchers().default.toEqual(screen.getPathname(), expected);
  },
  toHavePathnameWithParams(screen, expected) {
    return _matchers().default.toEqual(screen.getPathnameWithParams(), expected);
  },
  toHaveSegments(screen, expected) {
    return _matchers().default.toEqual(screen.getSegments(), expected);
  },
  toHaveSearchParams(screen, expected) {
    return _matchers().default.toEqual(screen.getSearchParams(), expected);
  }
});
//# sourceMappingURL=expect.js.map