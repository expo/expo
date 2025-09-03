/*before*/
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.test2 = exports.test = void 0;
/*after*/
/*before*/
require("foo")
/*after*/
;
/*before*/
require("foo-bar")
/*after*/
;
/*before*/
require("./directory/foo-bar")
/*after*/
;
var
/*before*/
_foo2 = babelHelpers.interopRequireDefault(require("foo2"))
/*after*/
;
var
/*before*/
foo2 = babelHelpers.interopRequireWildcard(require("foo3"))
/*after*/
;
var
/*before*/
_foo4 = require("foo4")
/*after*/
;
var
/*before*/
_foo5 = require("foo5")
/*after*/
;
var test;
var test2 =
/*before*/
exports.test2 =
/*after*/
5;
/*before*/
(0,
/*after*/
/*before*/
_foo4
/*after*/
.
/*before*/
bar)
/*after*/
(
/*before*/
_foo2
/*after*/
.
/*before*/
default
/*after*/
,
/*before*/
_foo5
/*after*/
.
/*before*/
foo
/*after*/
);

/* my comment */
/*before*/
_foo5
/*after*/
.
/*before*/
foo
/*after*/
;
/*before*/
_foo2
/*after*/
.
/*before*/
default
/*after*/
;
