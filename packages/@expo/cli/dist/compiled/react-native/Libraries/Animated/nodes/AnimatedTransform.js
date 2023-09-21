'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var _AnimatedNode = _interopRequireDefault(require("./AnimatedNode"));
var _AnimatedWithChildren2 = _interopRequireDefault(require("./AnimatedWithChildren"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var AnimatedTransform = function (_AnimatedWithChildren) {
  (0, _inherits2.default)(AnimatedTransform, _AnimatedWithChildren);
  var _super = _createSuper(AnimatedTransform);
  function AnimatedTransform(transforms) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedTransform);
    _this = _super.call(this);
    _this._transforms = transforms;
    return _this;
  }
  (0, _createClass2.default)(AnimatedTransform, [{
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      this._transforms.forEach(function (transform) {
        for (var key in transform) {
          var value = transform[key];
          if (value instanceof _AnimatedNode.default) {
            value.__makeNative(platformConfig);
          }
        }
      });
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedTransform.prototype), "__makeNative", this).call(this, platformConfig);
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      return this._get(function (animatedNode) {
        return animatedNode.__getValue();
      });
    }
  }, {
    key: "__getAnimatedValue",
    value: function __getAnimatedValue() {
      return this._get(function (animatedNode) {
        return animatedNode.__getAnimatedValue();
      });
    }
  }, {
    key: "__attach",
    value: function __attach() {
      var _this2 = this;
      this._transforms.forEach(function (transform) {
        for (var key in transform) {
          var value = transform[key];
          if (value instanceof _AnimatedNode.default) {
            value.__addChild(_this2);
          }
        }
      });
    }
  }, {
    key: "__detach",
    value: function __detach() {
      var _this3 = this;
      this._transforms.forEach(function (transform) {
        for (var key in transform) {
          var value = transform[key];
          if (value instanceof _AnimatedNode.default) {
            value.__removeChild(_this3);
          }
        }
      });
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedTransform.prototype), "__detach", this).call(this);
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      var transConfigs = [];
      this._transforms.forEach(function (transform) {
        for (var key in transform) {
          var value = transform[key];
          if (value instanceof _AnimatedNode.default) {
            transConfigs.push({
              type: 'animated',
              property: key,
              nodeTag: value.__getNativeTag()
            });
          } else {
            transConfigs.push({
              type: 'static',
              property: key,
              value: _NativeAnimatedHelper.default.transformDataType(value)
            });
          }
        }
      });
      _NativeAnimatedHelper.default.validateTransform(transConfigs);
      return {
        type: 'transform',
        transforms: transConfigs
      };
    }
  }, {
    key: "_get",
    value: function _get(getter) {
      return this._transforms.map(function (transform) {
        var result = {};
        for (var key in transform) {
          var value = transform[key];
          if (value instanceof _AnimatedNode.default) {
            result[key] = getter(value);
          } else if (Array.isArray(value)) {
            result[key] = value.map(function (element) {
              if (element instanceof _AnimatedNode.default) {
                return getter(element);
              } else {
                return element;
              }
            });
          } else if (typeof value === 'object') {
            result[key] = {};
            for (var _ref of Object.entries(value)) {
              var _ref2 = (0, _slicedToArray2.default)(_ref, 2);
              var nestedKey = _ref2[0];
              var nestedValue = _ref2[1];
              if (nestedValue instanceof _AnimatedNode.default) {
                result[key][nestedKey] = getter(nestedValue);
              } else {
                result[key][nestedKey] = nestedValue;
              }
            }
          } else {
            result[key] = value;
          }
        }
        return result;
      });
    }
  }]);
  return AnimatedTransform;
}(_AnimatedWithChildren2.default);
exports.default = AnimatedTransform;