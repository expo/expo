'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.test = exports.serialize = exports.default = void 0;
var _collections = require('../collections');
var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';
var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';
var IS_RECORD_SENTINEL = '@@__IMMUTABLE_RECORD__@@';
var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';
var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';
var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';
var getImmutableName = function getImmutableName(name) {
  return `Immutable.${name}`;
};
var printAsLeaf = function printAsLeaf(name) {
  return `[${name}]`;
};
var SPACE = ' ';
var LAZY = '…';
var printImmutableEntries = function printImmutableEntries(val, config, indentation, depth, refs, printer, type) {
  return ++depth > config.maxDepth ? printAsLeaf(getImmutableName(type)) : `${getImmutableName(type) + SPACE}{${(0, _collections.printIteratorEntries)(val.entries(), config, indentation, depth, refs, printer)}}`;
};
function getRecordEntries(val) {
  var i = 0;
  return {
    next: function next() {
      if (i < val._keys.length) {
        var key = val._keys[i++];
        return {
          done: false,
          value: [key, val.get(key)]
        };
      }
      return {
        done: true,
        value: undefined
      };
    }
  };
}
var printImmutableRecord = function printImmutableRecord(val, config, indentation, depth, refs, printer) {
  var name = getImmutableName(val._name || 'Record');
  return ++depth > config.maxDepth ? printAsLeaf(name) : `${name + SPACE}{${(0, _collections.printIteratorEntries)(getRecordEntries(val), config, indentation, depth, refs, printer)}}`;
};
var printImmutableSeq = function printImmutableSeq(val, config, indentation, depth, refs, printer) {
  var name = getImmutableName('Seq');
  if (++depth > config.maxDepth) {
    return printAsLeaf(name);
  }
  if (val[IS_KEYED_SENTINEL]) {
    return `${name + SPACE}{${val._iter || val._object ? (0, _collections.printIteratorEntries)(val.entries(), config, indentation, depth, refs, printer) : LAZY}}`;
  }
  return `${name + SPACE}[${val._iter || val._array || val._collection || val._iterable ? (0, _collections.printIteratorValues)(val.values(), config, indentation, depth, refs, printer) : LAZY}]`;
};
var printImmutableValues = function printImmutableValues(val, config, indentation, depth, refs, printer, type) {
  return ++depth > config.maxDepth ? printAsLeaf(getImmutableName(type)) : `${getImmutableName(type) + SPACE}[${(0, _collections.printIteratorValues)(val.values(), config, indentation, depth, refs, printer)}]`;
};
var serialize = function serialize(val, config, indentation, depth, refs, printer) {
  if (val[IS_MAP_SENTINEL]) {
    return printImmutableEntries(val, config, indentation, depth, refs, printer, val[IS_ORDERED_SENTINEL] ? 'OrderedMap' : 'Map');
  }
  if (val[IS_LIST_SENTINEL]) {
    return printImmutableValues(val, config, indentation, depth, refs, printer, 'List');
  }
  if (val[IS_SET_SENTINEL]) {
    return printImmutableValues(val, config, indentation, depth, refs, printer, val[IS_ORDERED_SENTINEL] ? 'OrderedSet' : 'Set');
  }
  if (val[IS_STACK_SENTINEL]) {
    return printImmutableValues(val, config, indentation, depth, refs, printer, 'Stack');
  }
  if (val[IS_SEQ_SENTINEL]) {
    return printImmutableSeq(val, config, indentation, depth, refs, printer);
  }
  return printImmutableRecord(val, config, indentation, depth, refs, printer);
};
exports.serialize = serialize;
var test = function test(val) {
  return val && (val[IS_ITERABLE_SENTINEL] === true || val[IS_RECORD_SENTINEL] === true);
};
exports.test = test;
var plugin = {
  serialize: serialize,
  test: test
};
var _default = plugin;
exports.default = _default;