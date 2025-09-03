"use strict";

function _foo() {
  const data = babelHelpers.interopRequireWildcard(require("foo"));
  _foo = function () {
    return data;
  };
  return data;
}
var foo = _foo;
console.log(foo(), _foo().bar);
