"use strict";

var _foo = require("./foo.js");
var y = true;
function f() {
  return [/* _foo hasBinding, getBinding */_foo.x, /* y hasBinding, getBinding */y, /* console no hasBinding, no getBinding */console];
}
