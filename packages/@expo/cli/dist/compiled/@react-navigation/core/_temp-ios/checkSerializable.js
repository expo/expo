var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkSerializable;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var checkSerializableWithoutCircularReference = function checkSerializableWithoutCircularReference(o, seen, location) {
  if (o === undefined || o === null || typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
    return {
      serializable: true
    };
  }
  if (Object.prototype.toString.call(o) !== '[object Object]' && !Array.isArray(o)) {
    return {
      serializable: false,
      location: location,
      reason: typeof o === 'function' ? 'Function' : String(o)
    };
  }
  if (seen.has(o)) {
    return {
      serializable: false,
      reason: 'Circular reference',
      location: location
    };
  }
  seen.add(o);
  if (Array.isArray(o)) {
    for (var i = 0; i < o.length; i++) {
      var childResult = checkSerializableWithoutCircularReference(o[i], new Set(seen), [].concat((0, _toConsumableArray2.default)(location), [i]));
      if (!childResult.serializable) {
        return childResult;
      }
    }
  } else {
    for (var _key in o) {
      var _childResult = checkSerializableWithoutCircularReference(o[_key], new Set(seen), [].concat((0, _toConsumableArray2.default)(location), [_key]));
      if (!_childResult.serializable) {
        return _childResult;
      }
    }
  }
  return {
    serializable: true
  };
};
function checkSerializable(o) {
  return checkSerializableWithoutCircularReference(o, new Set(), []);
}