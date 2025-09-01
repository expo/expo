"use strict";

function foo1() {
  const data = babelHelpers.interopRequireWildcard(require("white"));
  foo1 = function () {
    return data;
  };
  return data;
}
var foo2 = babelHelpers.interopRequireWildcard(require("black"));
console.log(foo1());
console.log(foo2);
