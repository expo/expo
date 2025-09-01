"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.foo = exports.bar = void 0;
let foo = exports.bar = exports.foo = void 0;
for (let _foo of []) {
  exports.bar = exports.foo = foo = _foo;
}
for (let _foo2 in []) {
  exports.bar = exports.foo = foo = _foo2;
}
for (let _foo4 of []) {
  exports.bar = exports.foo = foo = _foo4;
  let _foo3;
}
for (let _foo5 of []) {
  ({
    foo
  } = _foo5);
  exports.bar = exports.foo = foo;
}
for (let _foo7 of []) {
  ({
    foo
  } = _foo7);
  exports.bar = exports.foo = foo;
  let _foo6;
}
for (let _test of []) {
  ({
    test: {
      foo
    }
  } = _test);
  exports.bar = exports.foo = foo;
}
for (let _ref of []) {
  [foo, [...foo]] = _ref;
  exports.bar = exports.foo = foo;
}
for (let _ref2 of []) {
  [foo, [...foo]] = _ref2;
  exports.bar = exports.foo = foo;
  let _foo8;
}
for (let _foo9 of []) {
  exports.bar = exports.foo = foo = _foo9;
  ;
}
{
  let foo;
  for (foo of []) {}
}
