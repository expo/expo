'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.test = exports.serialize = exports.default = void 0;
var _collections = require('../collections');
var Symbol = globalThis['jest-symbol-do-not-touch'] || globalThis.Symbol;
var asymmetricMatcher = typeof Symbol === 'function' && Symbol.for ? Symbol.for('jest.asymmetricMatcher') : 0x1357a5;
var SPACE = ' ';
var serialize = function serialize(val, config, indentation, depth, refs, printer) {
  var stringedValue = val.toString();
  if (stringedValue === 'ArrayContaining' || stringedValue === 'ArrayNotContaining') {
    if (++depth > config.maxDepth) {
      return `[${stringedValue}]`;
    }
    return `${stringedValue + SPACE}[${(0, _collections.printListItems)(val.sample, config, indentation, depth, refs, printer)}]`;
  }
  if (stringedValue === 'ObjectContaining' || stringedValue === 'ObjectNotContaining') {
    if (++depth > config.maxDepth) {
      return `[${stringedValue}]`;
    }
    return `${stringedValue + SPACE}{${(0, _collections.printObjectProperties)(val.sample, config, indentation, depth, refs, printer)}}`;
  }
  if (stringedValue === 'StringMatching' || stringedValue === 'StringNotMatching') {
    return stringedValue + SPACE + printer(val.sample, config, indentation, depth, refs);
  }
  if (stringedValue === 'StringContaining' || stringedValue === 'StringNotContaining') {
    return stringedValue + SPACE + printer(val.sample, config, indentation, depth, refs);
  }
  if (typeof val.toAsymmetricMatcher !== 'function') {
    throw new Error(`Asymmetric matcher ${val.constructor.name} does not implement toAsymmetricMatcher()`);
  }
  return val.toAsymmetricMatcher();
};
exports.serialize = serialize;
var test = function test(val) {
  return val && val.$$typeof === asymmetricMatcher;
};
exports.test = test;
var plugin = {
  serialize: serialize,
  test: test
};
var _default = plugin;
exports.default = _default;