"use strict";

exports.foo = exports.baz = exports.bar = void 0;
const [foo, bar, ...baz] = [];
exports.baz = baz;
exports.bar = bar;
exports.foo = foo;
