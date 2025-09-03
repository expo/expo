"use strict";

function foo() {
  const data = babelHelpers.interopRequireWildcard(require("foo"));
  foo = function () {
    return data;
  };
  return data;
}
var foo2 = foo;
console.log(foo(), foo2());
