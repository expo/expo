'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.test = exports.serialize = exports.default = void 0;
var _markup = require('./lib/markup');
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;
var FRAGMENT_NODE = 11;
var ELEMENT_REGEXP = /^((HTML|SVG)\w*)?Element$/;
var testHasAttribute = function testHasAttribute(val) {
  try {
    return typeof val.hasAttribute === 'function' && val.hasAttribute('is');
  } catch (_unused) {
    return false;
  }
};
var testNode = function testNode(val) {
  var constructorName = val.constructor.name;
  var nodeType = val.nodeType,
    tagName = val.tagName;
  var isCustomElement = typeof tagName === 'string' && tagName.includes('-') || testHasAttribute(val);
  return nodeType === ELEMENT_NODE && (ELEMENT_REGEXP.test(constructorName) || isCustomElement) || nodeType === TEXT_NODE && constructorName === 'Text' || nodeType === COMMENT_NODE && constructorName === 'Comment' || nodeType === FRAGMENT_NODE && constructorName === 'DocumentFragment';
};
var test = function test(val) {
  var _val$constructor;
  return (val == null ? void 0 : (_val$constructor = val.constructor) == null ? void 0 : _val$constructor.name) && testNode(val);
};
exports.test = test;
function nodeIsText(node) {
  return node.nodeType === TEXT_NODE;
}
function nodeIsComment(node) {
  return node.nodeType === COMMENT_NODE;
}
function nodeIsFragment(node) {
  return node.nodeType === FRAGMENT_NODE;
}
var serialize = function serialize(node, config, indentation, depth, refs, printer) {
  if (nodeIsText(node)) {
    return (0, _markup.printText)(node.data, config);
  }
  if (nodeIsComment(node)) {
    return (0, _markup.printComment)(node.data, config);
  }
  var type = nodeIsFragment(node) ? 'DocumentFragment' : node.tagName.toLowerCase();
  if (++depth > config.maxDepth) {
    return (0, _markup.printElementAsLeaf)(type, config);
  }
  return (0, _markup.printElement)(type, (0, _markup.printProps)(nodeIsFragment(node) ? [] : Array.from(node.attributes, function (attr) {
    return attr.name;
  }).sort(), nodeIsFragment(node) ? {} : Array.from(node.attributes).reduce(function (props, attribute) {
    props[attribute.name] = attribute.value;
    return props;
  }, {}), config, indentation + config.indent, depth, refs, printer), (0, _markup.printChildren)(Array.prototype.slice.call(node.childNodes || node.children), config, indentation + config.indent, depth, refs, printer), config, indentation);
};
exports.serialize = serialize;
var plugin = {
  serialize: serialize,
  test: test
};
var _default = plugin;
exports.default = _default;