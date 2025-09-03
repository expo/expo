"use strict";

var _foo = _interopRequireDefault(require("foo"));
var Bar = _interopRequireWildcard(require("bar"));
var _baz = require("baz");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
_foo.default = (42, function () {
  throw new Error('"' + "Foo" + '" is read-only.');
}());
Bar = (43, function () {
  throw new Error('"' + "Bar" + '" is read-only.');
}());
_baz.Baz = (44, function () {
  throw new Error('"' + "Baz" + '" is read-only.');
}());
({
  Foo
} = ({}, function () {
  throw new Error('"' + "Foo" + '" is read-only.');
}()));
({
  Bar
} = ({}, function () {
  throw new Error('"' + "Bar" + '" is read-only.');
}()));
({
  Baz
} = ({}, function () {
  throw new Error('"' + "Baz" + '" is read-only.');
}()));
({
  prop: Foo
} = ({}, function () {
  throw new Error('"' + "Foo" + '" is read-only.');
}()));
({
  prop: Bar
} = ({}, function () {
  throw new Error('"' + "Bar" + '" is read-only.');
}()));
({
  prop: Baz
} = ({}, function () {
  throw new Error('"' + "Baz" + '" is read-only.');
}()));
_foo.default = _foo.default + (2, function () {
  throw new Error('"' + "Foo" + '" is read-only.');
}());
Bar = Bar + (2, function () {
  throw new Error('"' + "Bar" + '" is read-only.');
}());
_baz.Baz = _baz.Baz + (2, function () {
  throw new Error('"' + "Baz" + '" is read-only.');
}());
_foo.default = _foo.default >>> (3, function () {
  throw new Error('"' + "Foo" + '" is read-only.');
}());
Bar = Bar >>> (3, function () {
  throw new Error('"' + "Bar" + '" is read-only.');
}());
_baz.Baz = _baz.Baz >>> (3, function () {
  throw new Error('"' + "Baz" + '" is read-only.');
}());
_foo.default = _foo.default && (4, function () {
  throw new Error('"' + "Foo" + '" is read-only.');
}());
Bar = Bar && (4, function () {
  throw new Error('"' + "Bar" + '" is read-only.');
}());
_baz.Baz = _baz.Baz && (4, function () {
  throw new Error('"' + "Baz" + '" is read-only.');
}());
_foo.default -= function () {
  throw new Error('"' + "Foo" + '" is read-only.');
}();
Bar -= function () {
  throw new Error('"' + "Bar" + '" is read-only.');
}();
_baz.Baz -= function () {
  throw new Error('"' + "Baz" + '" is read-only.');
}();
_foo.default += function () {
  throw new Error('"' + "Foo" + '" is read-only.');
}();
Bar += function () {
  throw new Error('"' + "Bar" + '" is read-only.');
}();
_baz.Baz += function () {
  throw new Error('"' + "Baz" + '" is read-only.');
}();
for (let _Foo in {}) {
  (function () {
    throw new Error('"' + "Foo" + '" is read-only.');
  })();
  ;
}
for (let _Bar in {}) {
  (function () {
    throw new Error('"' + "Bar" + '" is read-only.');
  })();
}
for (let _Baz of []) {
  (function () {
    throw new Error('"' + "Baz" + '" is read-only.');
  })();
  let Baz;
}
for (let _Foo2 in {}) {
  (function () {
    throw new Error('"' + "Foo" + '" is read-only.');
  })();
}
for (let _ref in {}) {
  (function () {
    throw new Error('"' + "Bar" + '" is read-only.');
  })();
}
for (let _ref2 in {}) {
  (function () {
    throw new Error('"' + "Baz" + '" is read-only.');
  })();
}
