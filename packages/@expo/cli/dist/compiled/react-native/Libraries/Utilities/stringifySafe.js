var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createStringifySafeWithLimits = createStringifySafeWithLimits;
exports.default = void 0;
var _invariant = _interopRequireDefault(require("invariant"));
function createStringifySafeWithLimits(limits) {
  var _limits$maxDepth = limits.maxDepth,
    maxDepth = _limits$maxDepth === void 0 ? Number.POSITIVE_INFINITY : _limits$maxDepth,
    _limits$maxStringLimi = limits.maxStringLimit,
    maxStringLimit = _limits$maxStringLimi === void 0 ? Number.POSITIVE_INFINITY : _limits$maxStringLimi,
    _limits$maxArrayLimit = limits.maxArrayLimit,
    maxArrayLimit = _limits$maxArrayLimit === void 0 ? Number.POSITIVE_INFINITY : _limits$maxArrayLimit,
    _limits$maxObjectKeys = limits.maxObjectKeysLimit,
    maxObjectKeysLimit = _limits$maxObjectKeys === void 0 ? Number.POSITIVE_INFINITY : _limits$maxObjectKeys;
  var stack = [];
  function replacer(key, value) {
    while (stack.length && this !== stack[0]) {
      stack.shift();
    }
    if (typeof value === 'string') {
      var truncatedString = '...(truncated)...';
      if (value.length > maxStringLimit + truncatedString.length) {
        return value.substring(0, maxStringLimit) + truncatedString;
      }
      return value;
    }
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    var retval = value;
    if (Array.isArray(value)) {
      if (stack.length >= maxDepth) {
        retval = `[ ... array with ${value.length} values ... ]`;
      } else if (value.length > maxArrayLimit) {
        retval = value.slice(0, maxArrayLimit).concat([`... extra ${value.length - maxArrayLimit} values truncated ...`]);
      }
    } else {
      (0, _invariant.default)(typeof value === 'object', 'This was already found earlier');
      var keys = Object.keys(value);
      if (stack.length >= maxDepth) {
        retval = `{ ... object with ${keys.length} keys ... }`;
      } else if (keys.length > maxObjectKeysLimit) {
        retval = {};
        for (var k of keys.slice(0, maxObjectKeysLimit)) {
          retval[k] = value[k];
        }
        var truncatedKey = '...(truncated keys)...';
        retval[truncatedKey] = keys.length - maxObjectKeysLimit;
      }
    }
    stack.unshift(retval);
    return retval;
  }
  return function stringifySafe(arg) {
    if (arg === undefined) {
      return 'undefined';
    } else if (arg === null) {
      return 'null';
    } else if (typeof arg === 'function') {
      try {
        return arg.toString();
      } catch (e) {
        return '[function unknown]';
      }
    } else if (arg instanceof Error) {
      return arg.name + ': ' + arg.message;
    } else {
      try {
        var ret = JSON.stringify(arg, replacer);
        if (ret === undefined) {
          return '["' + typeof arg + '" failed to stringify]';
        }
        return ret;
      } catch (e) {
        if (typeof arg.toString === 'function') {
          try {
            return arg.toString();
          } catch (E) {}
        }
      }
    }
    return '["' + typeof arg + '" failed to stringify]';
  };
}
var stringifySafe = createStringifySafeWithLimits({
  maxDepth: 10,
  maxStringLimit: 100,
  maxArrayLimit: 50,
  maxObjectKeysLimit: 50
});
var _default = stringifySafe;
exports.default = _default;
//# sourceMappingURL=stringifySafe.js.map