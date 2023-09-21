'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _normalizeColor = _interopRequireDefault(require("../../StyleSheet/normalizeColor"));
var _processColor = _interopRequireDefault(require("../../StyleSheet/processColor"));
var _Easing = _interopRequireDefault(require("../Easing"));
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var _AnimatedWithChildren2 = _interopRequireDefault(require("./AnimatedWithChildren"));
var _invariant = _interopRequireDefault(require("invariant"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function createNumericInterpolation(config) {
  var outputRange = config.outputRange;
  var inputRange = config.inputRange;
  var easing = config.easing || _Easing.default.linear;
  var extrapolateLeft = 'extend';
  if (config.extrapolateLeft !== undefined) {
    extrapolateLeft = config.extrapolateLeft;
  } else if (config.extrapolate !== undefined) {
    extrapolateLeft = config.extrapolate;
  }
  var extrapolateRight = 'extend';
  if (config.extrapolateRight !== undefined) {
    extrapolateRight = config.extrapolateRight;
  } else if (config.extrapolate !== undefined) {
    extrapolateRight = config.extrapolate;
  }
  return function (input) {
    (0, _invariant.default)(typeof input === 'number', 'Cannot interpolation an input which is not a number');
    var range = findRange(input, inputRange);
    return interpolate(input, inputRange[range], inputRange[range + 1], outputRange[range], outputRange[range + 1], easing, extrapolateLeft, extrapolateRight);
  };
}
function interpolate(input, inputMin, inputMax, outputMin, outputMax, easing, extrapolateLeft, extrapolateRight) {
  var result = input;
  if (result < inputMin) {
    if (extrapolateLeft === 'identity') {
      return result;
    } else if (extrapolateLeft === 'clamp') {
      result = inputMin;
    } else if (extrapolateLeft === 'extend') {}
  }
  if (result > inputMax) {
    if (extrapolateRight === 'identity') {
      return result;
    } else if (extrapolateRight === 'clamp') {
      result = inputMax;
    } else if (extrapolateRight === 'extend') {}
  }
  if (outputMin === outputMax) {
    return outputMin;
  }
  if (inputMin === inputMax) {
    if (input <= inputMin) {
      return outputMin;
    }
    return outputMax;
  }
  if (inputMin === -Infinity) {
    result = -result;
  } else if (inputMax === Infinity) {
    result = result - inputMin;
  } else {
    result = (result - inputMin) / (inputMax - inputMin);
  }
  result = easing(result);
  if (outputMin === -Infinity) {
    result = -result;
  } else if (outputMax === Infinity) {
    result = result + outputMin;
  } else {
    result = result * (outputMax - outputMin) + outputMin;
  }
  return result;
}
var numericComponentRegex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
function mapStringToNumericComponents(input) {
  var normalizedColor = (0, _normalizeColor.default)(input);
  (0, _invariant.default)(normalizedColor == null || typeof normalizedColor !== 'object', 'PlatformColors are not supported');
  if (typeof normalizedColor === 'number') {
    normalizedColor = normalizedColor || 0;
    var r = (normalizedColor & 0xff000000) >>> 24;
    var g = (normalizedColor & 0x00ff0000) >>> 16;
    var b = (normalizedColor & 0x0000ff00) >>> 8;
    var a = (normalizedColor & 0x000000ff) / 255;
    return {
      isColor: true,
      components: [r, g, b, a]
    };
  } else {
    var components = [];
    var lastMatchEnd = 0;
    var match;
    while ((match = numericComponentRegex.exec(input)) != null) {
      if (match.index > lastMatchEnd) {
        components.push(input.substring(lastMatchEnd, match.index));
      }
      components.push(parseFloat(match[0]));
      lastMatchEnd = match.index + match[0].length;
    }
    (0, _invariant.default)(components.length > 0, 'outputRange must contain color or value with numeric component');
    if (lastMatchEnd < input.length) {
      components.push(input.substring(lastMatchEnd, input.length));
    }
    return {
      isColor: false,
      components: components
    };
  }
}
function createStringInterpolation(config) {
  (0, _invariant.default)(config.outputRange.length >= 2, 'Bad output range');
  var outputRange = config.outputRange.map(mapStringToNumericComponents);
  var isColor = outputRange[0].isColor;
  if (__DEV__) {
    (0, _invariant.default)(outputRange.every(function (output) {
      return output.isColor === isColor;
    }), 'All elements of output range should either be a color or a string with numeric components');
    var firstOutput = outputRange[0].components;
    (0, _invariant.default)(outputRange.every(function (output) {
      return output.components.length === firstOutput.length;
    }), 'All elements of output range should have the same number of components');
    (0, _invariant.default)(outputRange.every(function (output) {
      return output.components.every(function (component, i) {
        return typeof component === 'number' || component === firstOutput[i];
      });
    }), 'All elements of output range should have the same non-numeric components');
  }
  var numericComponents = outputRange.map(function (output) {
    return isColor ? output.components : output.components.filter(function (c) {
      return typeof c === 'number';
    });
  });
  var interpolations = numericComponents[0].map(function (_, i) {
    return createNumericInterpolation(Object.assign({}, config, {
      outputRange: numericComponents.map(function (components) {
        return components[i];
      })
    }));
  });
  if (!isColor) {
    return function (input) {
      var values = interpolations.map(function (interpolation) {
        return interpolation(input);
      });
      var i = 0;
      return outputRange[0].components.map(function (c) {
        return typeof c === 'number' ? values[i++] : c;
      }).join('');
    };
  } else {
    return function (input) {
      var result = interpolations.map(function (interpolation, i) {
        var value = interpolation(input);
        return i < 3 ? Math.round(value) : Math.round(value * 1000) / 1000;
      });
      return `rgba(${result[0]}, ${result[1]}, ${result[2]}, ${result[3]})`;
    };
  }
}
function findRange(input, inputRange) {
  var i;
  for (i = 1; i < inputRange.length - 1; ++i) {
    if (inputRange[i] >= input) {
      break;
    }
  }
  return i - 1;
}
function checkValidRanges(inputRange, outputRange) {
  checkInfiniteRange('outputRange', outputRange);
  checkInfiniteRange('inputRange', inputRange);
  checkValidInputRange(inputRange);
  (0, _invariant.default)(inputRange.length === outputRange.length, 'inputRange (' + inputRange.length + ') and outputRange (' + outputRange.length + ') must have the same length');
}
function checkValidInputRange(arr) {
  (0, _invariant.default)(arr.length >= 2, 'inputRange must have at least 2 elements');
  var message = 'inputRange must be monotonically non-decreasing ' + String(arr);
  for (var i = 1; i < arr.length; ++i) {
    (0, _invariant.default)(arr[i] >= arr[i - 1], message);
  }
}
function checkInfiniteRange(name, arr) {
  (0, _invariant.default)(arr.length >= 2, name + ' must have at least 2 elements');
  (0, _invariant.default)(arr.length !== 2 || arr[0] !== -Infinity || arr[1] !== Infinity, name + 'cannot be ]-infinity;+infinity[ ' + arr);
}
var AnimatedInterpolation = function (_AnimatedWithChildren) {
  (0, _inherits2.default)(AnimatedInterpolation, _AnimatedWithChildren);
  var _super = _createSuper(AnimatedInterpolation);
  function AnimatedInterpolation(parent, config) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedInterpolation);
    _this = _super.call(this);
    _this._parent = parent;
    _this._config = config;
    if (__DEV__) {
      checkValidRanges(config.inputRange, config.outputRange);
      _this._getInterpolation();
    }
    return _this;
  }
  (0, _createClass2.default)(AnimatedInterpolation, [{
    key: "_getInterpolation",
    value: function _getInterpolation() {
      if (!this._interpolation) {
        var config = this._config;
        if (config.outputRange && typeof config.outputRange[0] === 'string') {
          this._interpolation = createStringInterpolation(config);
        } else {
          this._interpolation = createNumericInterpolation(config);
        }
      }
      return this._interpolation;
    }
  }, {
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      this._parent.__makeNative(platformConfig);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedInterpolation.prototype), "__makeNative", this).call(this, platformConfig);
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      var parentValue = this._parent.__getValue();
      (0, _invariant.default)(typeof parentValue === 'number', 'Cannot interpolate an input which is not a number.');
      return this._getInterpolation()(parentValue);
    }
  }, {
    key: "interpolate",
    value: function interpolate(config) {
      return new AnimatedInterpolation(this, config);
    }
  }, {
    key: "__attach",
    value: function __attach() {
      this._parent.__addChild(this);
    }
  }, {
    key: "__detach",
    value: function __detach() {
      this._parent.__removeChild(this);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedInterpolation.prototype), "__detach", this).call(this);
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      if (__DEV__) {
        _NativeAnimatedHelper.default.validateInterpolation(this._config);
      }
      var outputRange = this._config.outputRange;
      var outputType = null;
      if (typeof outputRange[0] === 'string') {
        outputRange = outputRange.map(function (value) {
          var processedColor = (0, _processColor.default)(value);
          if (typeof processedColor === 'number') {
            outputType = 'color';
            return processedColor;
          } else {
            return _NativeAnimatedHelper.default.transformDataType(value);
          }
        });
      }
      return {
        inputRange: this._config.inputRange,
        outputRange: outputRange,
        outputType: outputType,
        extrapolateLeft: this._config.extrapolateLeft || this._config.extrapolate || 'extend',
        extrapolateRight: this._config.extrapolateRight || this._config.extrapolate || 'extend',
        type: 'interpolation'
      };
    }
  }]);
  return AnimatedInterpolation;
}(_AnimatedWithChildren2.default);
exports.default = AnimatedInterpolation;