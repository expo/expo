"use strict";

function _white() {
  const data = require("white");
  _white = function () {
    return data;
  };
  return data;
}
var _black = require("black");
console.log(_white().foo1);
console.log(_black.foo2);
