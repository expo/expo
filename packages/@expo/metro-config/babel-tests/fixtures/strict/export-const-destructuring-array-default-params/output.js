"use strict";

exports.foo = exports.bar = void 0;
const [foo, bar = 2] = [];
exports.bar = bar;
exports.foo = foo;
