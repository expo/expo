"use strict";

function foo() {
  const data = babelHelpers.interopRequireWildcard(require("foo"));
  foo = function () {
    return data;
  };
  return data;
}
console.log(foo());
