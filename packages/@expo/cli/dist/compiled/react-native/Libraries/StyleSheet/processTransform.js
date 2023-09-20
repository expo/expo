'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var stringifySafe = require("../Utilities/stringifySafe").default;
var invariant = require('invariant');
function processTransform(transform) {
  if (typeof transform === 'string') {
    var regex = new RegExp(/(\w+)\(([^)]+)\)/g);
    var transformArray = [];
    var matches;
    while (matches = regex.exec(transform)) {
      var _getKeyAndValueFromCS = _getKeyAndValueFromCSSTransform(matches[1], matches[2]),
        _key = _getKeyAndValueFromCS.key,
        value = _getKeyAndValueFromCS.value;
      if (value !== undefined) {
        transformArray.push((0, _defineProperty2.default)({}, _key, value));
      }
    }
    transform = transformArray;
  }
  if (__DEV__) {
    _validateTransforms(transform);
  }
  return transform;
}
var _getKeyAndValueFromCSSTransform = function _getKeyAndValueFromCSSTransform(key, args) {
  var _args$match;
  var argsWithUnitsRegex = new RegExp(/([+-]?\d+(\.\d+)?)([a-zA-Z]+)?/g);
  switch (key) {
    case 'matrix':
      return {
        key: key,
        value: (_args$match = args.match(/[+-]?\d+(\.\d+)?/g)) == null ? void 0 : _args$match.map(Number)
      };
    case 'translate':
    case 'translate3d':
      var parsedArgs = [];
      var missingUnitOfMeasurement = false;
      var matches;
      while (matches = argsWithUnitsRegex.exec(args)) {
        var _value = Number(matches[1]);
        var _unitOfMeasurement = matches[3];
        if (_value !== 0 && !_unitOfMeasurement) {
          missingUnitOfMeasurement = true;
        }
        parsedArgs.push(_value);
      }
      if (__DEV__) {
        invariant(!missingUnitOfMeasurement, `Transform with key ${key} must have units unless the provided value is 0, found %s`, `${key}(${args})`);
        if (key === 'translate') {
          invariant((parsedArgs == null ? void 0 : parsedArgs.length) === 1 || (parsedArgs == null ? void 0 : parsedArgs.length) === 2, 'Transform with key translate must be an string with 1 or 2 parameters, found %s: %s', parsedArgs == null ? void 0 : parsedArgs.length, `${key}(${args})`);
        } else {
          invariant((parsedArgs == null ? void 0 : parsedArgs.length) === 3, 'Transform with key translate3d must be an string with 3 parameters, found %s: %s', parsedArgs == null ? void 0 : parsedArgs.length, `${key}(${args})`);
        }
      }
      if ((parsedArgs == null ? void 0 : parsedArgs.length) === 1) {
        parsedArgs.push(0);
      }
      return {
        key: 'translate',
        value: parsedArgs
      };
    case 'translateX':
    case 'translateY':
    case 'perspective':
      var argMatches = argsWithUnitsRegex.exec(args);
      if (!(argMatches != null && argMatches.length)) {
        return {
          key: key,
          value: undefined
        };
      }
      var value = Number(argMatches[1]);
      var unitOfMeasurement = argMatches[3];
      if (__DEV__) {
        invariant(value === 0 || unitOfMeasurement, `Transform with key ${key} must have units unless the provided value is 0, found %s`, `${key}(${args})`);
      }
      return {
        key: key,
        value: value
      };
    default:
      return {
        key: key,
        value: !isNaN(args) ? Number(args) : args
      };
  }
};
function _validateTransforms(transform) {
  transform.forEach(function (transformation) {
    var keys = Object.keys(transformation);
    invariant(keys.length === 1, 'You must specify exactly one property per transform object. Passed properties: %s', stringifySafe(transformation));
    var key = keys[0];
    var value = transformation[key];
    _validateTransform(key, value, transformation);
  });
}
function _validateTransform(key, value, transformation) {
  invariant(!value.getValue, 'You passed an Animated.Value to a normal component. ' + 'You need to wrap that component in an Animated. For example, ' + 'replace <View /> by <Animated.View />.');
  var multivalueTransforms = ['matrix', 'translate'];
  if (multivalueTransforms.indexOf(key) !== -1) {
    invariant(Array.isArray(value), 'Transform with key of %s must have an array as the value: %s', key, stringifySafe(transformation));
  }
  switch (key) {
    case 'matrix':
      invariant(value.length === 9 || value.length === 16, 'Matrix transform must have a length of 9 (2d) or 16 (3d). ' + 'Provided matrix has a length of %s: %s', value.length, stringifySafe(transformation));
      break;
    case 'translate':
      invariant(value.length === 2 || value.length === 3, 'Transform with key translate must be an array of length 2 or 3, found %s: %s', value.length, stringifySafe(transformation));
      break;
    case 'rotateX':
    case 'rotateY':
    case 'rotateZ':
    case 'rotate':
    case 'skewX':
    case 'skewY':
      invariant(typeof value === 'string', 'Transform with key of "%s" must be a string: %s', key, stringifySafe(transformation));
      invariant(value.indexOf('deg') > -1 || value.indexOf('rad') > -1, 'Rotate transform must be expressed in degrees (deg) or radians ' + '(rad): %s', stringifySafe(transformation));
      break;
    case 'perspective':
      invariant(typeof value === 'number', 'Transform with key of "%s" must be a number: %s', key, stringifySafe(transformation));
      invariant(value !== 0, 'Transform with key of "%s" cannot be zero: %s', key, stringifySafe(transformation));
      break;
    case 'translateX':
    case 'translateY':
    case 'scale':
    case 'scaleX':
    case 'scaleY':
      invariant(typeof value === 'number', 'Transform with key of "%s" must be a number: %s', key, stringifySafe(transformation));
      break;
    default:
      invariant(false, 'Invalid transform %s: %s', key, stringifySafe(transformation));
  }
}
module.exports = processTransform;
//# sourceMappingURL=processTransform.js.map