'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.test = exports.serialize = exports.default = void 0;
var _collections = require('../collections');
var SPACE = ' ';
var OBJECT_NAMES = ['DOMStringMap', 'NamedNodeMap'];
var ARRAY_REGEXP = /^(HTML\w*Collection|NodeList)$/;
var testName = function testName(name) {
  return OBJECT_NAMES.indexOf(name) !== -1 || ARRAY_REGEXP.test(name);
};
var test = function test(val) {
  return val && val.constructor && !!val.constructor.name && testName(val.constructor.name);
};
exports.test = test;
var isNamedNodeMap = function isNamedNodeMap(collection) {
  return collection.constructor.name === 'NamedNodeMap';
};
var serialize = function serialize(collection, config, indentation, depth, refs, printer) {
  var name = collection.constructor.name;
  if (++depth > config.maxDepth) {
    return `[${name}]`;
  }
  return (config.min ? '' : name + SPACE) + (OBJECT_NAMES.indexOf(name) !== -1 ? `{${(0, _collections.printObjectProperties)(isNamedNodeMap(collection) ? Array.from(collection).reduce(function (props, attribute) {
    props[attribute.name] = attribute.value;
    return props;
  }, {}) : Object.assign({}, collection), config, indentation, depth, refs, printer)}}` : `[${(0, _collections.printListItems)(Array.from(collection), config, indentation, depth, refs, printer)}]`);
};
exports.serialize = serialize;
var plugin = {
  serialize: serialize,
  test: test
};
var _default = plugin;
exports.default = _default;