"use strict";

function _foo() {
  const data = require("foo");
  _foo = function () {
    return data;
  };
  return data;
}
console.log(_foo().foo);
