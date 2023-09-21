'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.test = exports.serialize = exports.default = void 0;
var _markup = require('./lib/markup');
var Symbol = globalThis['jest-symbol-do-not-touch'] || globalThis.Symbol;
var testSymbol = typeof Symbol === 'function' && Symbol.for ? Symbol.for('react.test.json') : 0xea71357;
var getPropKeys = function getPropKeys(object) {
  var props = object.props;
  return props ? Object.keys(props).filter(function (key) {
    return props[key] !== undefined;
  }).sort() : [];
};
var serialize = function serialize(object, config, indentation, depth, refs, printer) {
  return ++depth > config.maxDepth ? (0, _markup.printElementAsLeaf)(object.type, config) : (0, _markup.printElement)(object.type, object.props ? (0, _markup.printProps)(getPropKeys(object), object.props, config, indentation + config.indent, depth, refs, printer) : '', object.children ? (0, _markup.printChildren)(object.children, config, indentation + config.indent, depth, refs, printer) : '', config, indentation);
};
exports.serialize = serialize;
var test = function test(val) {
  return val && val.$$typeof === testSymbol;
};
exports.test = test;
var plugin = {
  serialize: serialize,
  test: test
};
var _default = plugin;
exports.default = _default;