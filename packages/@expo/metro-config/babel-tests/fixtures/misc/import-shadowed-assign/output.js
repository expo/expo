"use strict";

var _x = require("x");
function f(foo) {
  foo = 2;
  [foo] = [];
  ({
    foo
  } = {});
}
_x.foo = (2, function () {
  throw new Error('"' + "foo" + '" is read-only.');
}());
[foo] = ([], function () {
  throw new Error('"' + "foo" + '" is read-only.');
}());
({
  foo
} = ({}, function () {
  throw new Error('"' + "foo" + '" is read-only.');
}()));
