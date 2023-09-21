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
var _flattenStyle = _interopRequireDefault(require("../../StyleSheet/flattenStyle"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var _AnimatedNode = _interopRequireDefault(require("./AnimatedNode"));
var _AnimatedTransform = _interopRequireDefault(require("./AnimatedTransform"));
var _AnimatedWithChildren2 = _interopRequireDefault(require("./AnimatedWithChildren"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function createAnimatedStyle(inputStyle) {
  var style = (0, _flattenStyle.default)(inputStyle);
  var animatedStyles = {};
  for (var key in style) {
    var value = style[key];
    if (key === 'transform') {
      animatedStyles[key] = new _AnimatedTransform.default(value);
    } else if (value instanceof _AnimatedNode.default) {
      animatedStyles[key] = value;
    } else if (value && !Array.isArray(value) && typeof value === 'object') {
      animatedStyles[key] = createAnimatedStyle(value);
    }
  }
  return animatedStyles;
}
function createStyleWithAnimatedTransform(inputStyle) {
  var style = (0, _flattenStyle.default)(inputStyle) || {};
  if (style.transform) {
    style = Object.assign({}, style, {
      transform: new _AnimatedTransform.default(style.transform)
    });
  }
  return style;
}
var AnimatedStyle = function (_AnimatedWithChildren) {
  (0, _inherits2.default)(AnimatedStyle, _AnimatedWithChildren);
  var _super = _createSuper(AnimatedStyle);
  function AnimatedStyle(style) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedStyle);
    _this = _super.call(this);
    if (_Platform.default.OS === 'web') {
      _this._inputStyle = style;
      _this._style = createAnimatedStyle(style);
    } else {
      _this._style = createStyleWithAnimatedTransform(style);
    }
    return _this;
  }
  (0, _createClass2.default)(AnimatedStyle, [{
    key: "_walkStyleAndGetValues",
    value: function _walkStyleAndGetValues(style) {
      var updatedStyle = {};
      for (var key in style) {
        var value = style[key];
        if (value instanceof _AnimatedNode.default) {
          updatedStyle[key] = value.__getValue();
        } else if (value && !Array.isArray(value) && typeof value === 'object') {
          updatedStyle[key] = this._walkStyleAndGetValues(value);
        } else {
          updatedStyle[key] = value;
        }
      }
      return updatedStyle;
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      if (_Platform.default.OS === 'web') {
        return [this._inputStyle, this._walkStyleAndGetValues(this._style)];
      }
      return this._walkStyleAndGetValues(this._style);
    }
  }, {
    key: "_walkStyleAndGetAnimatedValues",
    value: function _walkStyleAndGetAnimatedValues(style) {
      var updatedStyle = {};
      for (var key in style) {
        var value = style[key];
        if (value instanceof _AnimatedNode.default) {
          updatedStyle[key] = value.__getAnimatedValue();
        } else if (value && !Array.isArray(value) && typeof value === 'object') {
          updatedStyle[key] = this._walkStyleAndGetAnimatedValues(value);
        }
      }
      return updatedStyle;
    }
  }, {
    key: "__getAnimatedValue",
    value: function __getAnimatedValue() {
      return this._walkStyleAndGetAnimatedValues(this._style);
    }
  }, {
    key: "__attach",
    value: function __attach() {
      for (var key in this._style) {
        var value = this._style[key];
        if (value instanceof _AnimatedNode.default) {
          value.__addChild(this);
        }
      }
    }
  }, {
    key: "__detach",
    value: function __detach() {
      for (var key in this._style) {
        var value = this._style[key];
        if (value instanceof _AnimatedNode.default) {
          value.__removeChild(this);
        }
      }
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedStyle.prototype), "__detach", this).call(this);
    }
  }, {
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      for (var key in this._style) {
        var value = this._style[key];
        if (value instanceof _AnimatedNode.default) {
          value.__makeNative(platformConfig);
        }
      }
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedStyle.prototype), "__makeNative", this).call(this, platformConfig);
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      var styleConfig = {};
      for (var styleKey in this._style) {
        if (this._style[styleKey] instanceof _AnimatedNode.default) {
          var style = this._style[styleKey];
          style.__makeNative(this.__getPlatformConfig());
          styleConfig[styleKey] = style.__getNativeTag();
        }
      }
      _NativeAnimatedHelper.default.validateStyles(styleConfig);
      return {
        type: 'style',
        style: styleConfig
      };
    }
  }]);
  return AnimatedStyle;
}(_AnimatedWithChildren2.default);
exports.default = AnimatedStyle;