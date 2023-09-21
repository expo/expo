'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.printIteratorEntries = printIteratorEntries;
exports.printIteratorValues = printIteratorValues;
exports.printListItems = printListItems;
exports.printObjectProperties = printObjectProperties;
var getKeysOfEnumerableProperties = function getKeysOfEnumerableProperties(object, compareKeys) {
  var rawKeys = Object.keys(object);
  var keys = compareKeys !== null ? rawKeys.sort(compareKeys) : rawKeys;
  if (Object.getOwnPropertySymbols) {
    Object.getOwnPropertySymbols(object).forEach(function (symbol) {
      if (Object.getOwnPropertyDescriptor(object, symbol).enumerable) {
        keys.push(symbol);
      }
    });
  }
  return keys;
};
function printIteratorEntries(iterator, config, indentation, depth, refs, printer) {
  var separator = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : ': ';
  var result = '';
  var width = 0;
  var current = iterator.next();
  if (!current.done) {
    result += config.spacingOuter;
    var indentationNext = indentation + config.indent;
    while (!current.done) {
      result += indentationNext;
      if (width++ === config.maxWidth) {
        result += '…';
        break;
      }
      var name = printer(current.value[0], config, indentationNext, depth, refs);
      var value = printer(current.value[1], config, indentationNext, depth, refs);
      result += name + separator + value;
      current = iterator.next();
      if (!current.done) {
        result += `,${config.spacingInner}`;
      } else if (!config.min) {
        result += ',';
      }
    }
    result += config.spacingOuter + indentation;
  }
  return result;
}
function printIteratorValues(iterator, config, indentation, depth, refs, printer) {
  var result = '';
  var width = 0;
  var current = iterator.next();
  if (!current.done) {
    result += config.spacingOuter;
    var indentationNext = indentation + config.indent;
    while (!current.done) {
      result += indentationNext;
      if (width++ === config.maxWidth) {
        result += '…';
        break;
      }
      result += printer(current.value, config, indentationNext, depth, refs);
      current = iterator.next();
      if (!current.done) {
        result += `,${config.spacingInner}`;
      } else if (!config.min) {
        result += ',';
      }
    }
    result += config.spacingOuter + indentation;
  }
  return result;
}
function printListItems(list, config, indentation, depth, refs, printer) {
  var result = '';
  if (list.length) {
    result += config.spacingOuter;
    var indentationNext = indentation + config.indent;
    for (var i = 0; i < list.length; i++) {
      result += indentationNext;
      if (i === config.maxWidth) {
        result += '…';
        break;
      }
      if (i in list) {
        result += printer(list[i], config, indentationNext, depth, refs);
      }
      if (i < list.length - 1) {
        result += `,${config.spacingInner}`;
      } else if (!config.min) {
        result += ',';
      }
    }
    result += config.spacingOuter + indentation;
  }
  return result;
}
function printObjectProperties(val, config, indentation, depth, refs, printer) {
  var result = '';
  var keys = getKeysOfEnumerableProperties(val, config.compareKeys);
  if (keys.length) {
    result += config.spacingOuter;
    var indentationNext = indentation + config.indent;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var name = printer(key, config, indentationNext, depth, refs);
      var value = printer(val[key], config, indentationNext, depth, refs);
      result += `${indentationNext + name}: ${value}`;
      if (i < keys.length - 1) {
        result += `,${config.spacingInner}`;
      } else if (!config.min) {
        result += ',';
      }
    }
    result += config.spacingOuter + indentation;
  }
  return result;
}