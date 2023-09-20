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
var _PlatformColorValueTypes = require("../../StyleSheet/PlatformColorValueTypes");
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var _AnimatedValue = _interopRequireWildcard(require("./AnimatedValue"));
var _AnimatedWithChildren2 = _interopRequireDefault(require("./AnimatedWithChildren"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var NativeAnimatedAPI = _NativeAnimatedHelper.default.API;
var defaultColor = {
  r: 0,
  g: 0,
  b: 0,
  a: 1.0
};
function processColor(color) {
  if (color === undefined || color === null) {
    return null;
  }
  if (isRgbaValue(color)) {
    return color;
  }
  var normalizedColor = (0, _normalizeColor.default)(color);
  if (normalizedColor === undefined || normalizedColor === null) {
    return null;
  }
  if (typeof normalizedColor === 'object') {
    var processedColorObj = (0, _PlatformColorValueTypes.processColorObject)(normalizedColor);
    if (processedColorObj != null) {
      return processedColorObj;
    }
  } else if (typeof normalizedColor === 'number') {
    var r = (normalizedColor & 0xff000000) >>> 24;
    var g = (normalizedColor & 0x00ff0000) >>> 16;
    var b = (normalizedColor & 0x0000ff00) >>> 8;
    var a = (normalizedColor & 0x000000ff) / 255;
    return {
      r: r,
      g: g,
      b: b,
      a: a
    };
  }
  return null;
}
function isRgbaValue(value) {
  return value && typeof value.r === 'number' && typeof value.g === 'number' && typeof value.b === 'number' && typeof value.a === 'number';
}
function isRgbaAnimatedValue(value) {
  return value && value.r instanceof _AnimatedValue.default && value.g instanceof _AnimatedValue.default && value.b instanceof _AnimatedValue.default && value.a instanceof _AnimatedValue.default;
}
var AnimatedColor = function (_AnimatedWithChildren) {
  (0, _inherits2.default)(AnimatedColor, _AnimatedWithChildren);
  var _super = _createSuper(AnimatedColor);
  function AnimatedColor(valueIn, config) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedColor);
    _this = _super.call(this);
    _this._suspendCallbacks = 0;
    var value = valueIn != null ? valueIn : defaultColor;
    if (isRgbaAnimatedValue(value)) {
      var rgbaAnimatedValue = value;
      _this.r = rgbaAnimatedValue.r;
      _this.g = rgbaAnimatedValue.g;
      _this.b = rgbaAnimatedValue.b;
      _this.a = rgbaAnimatedValue.a;
    } else {
      var _processColor;
      var processedColor = (_processColor = processColor(value)) != null ? _processColor : defaultColor;
      var initColor = defaultColor;
      if (isRgbaValue(processedColor)) {
        initColor = processedColor;
      } else {
        _this.nativeColor = processedColor;
      }
      _this.r = new _AnimatedValue.default(initColor.r);
      _this.g = new _AnimatedValue.default(initColor.g);
      _this.b = new _AnimatedValue.default(initColor.b);
      _this.a = new _AnimatedValue.default(initColor.a);
    }
    if (config != null && config.useNativeDriver) {
      _this.__makeNative();
    }
    return _this;
  }
  (0, _createClass2.default)(AnimatedColor, [{
    key: "setValue",
    value: function setValue(value) {
      var _processColor2,
        _this2 = this;
      var shouldUpdateNodeConfig = false;
      if (this.__isNative) {
        var nativeTag = this.__getNativeTag();
        NativeAnimatedAPI.setWaitingForIdentifier(nativeTag.toString());
      }
      var processedColor = (_processColor2 = processColor(value)) != null ? _processColor2 : defaultColor;
      this._withSuspendedCallbacks(function () {
        if (isRgbaValue(processedColor)) {
          var rgbaValue = processedColor;
          _this2.r.setValue(rgbaValue.r);
          _this2.g.setValue(rgbaValue.g);
          _this2.b.setValue(rgbaValue.b);
          _this2.a.setValue(rgbaValue.a);
          if (_this2.nativeColor != null) {
            _this2.nativeColor = null;
            shouldUpdateNodeConfig = true;
          }
        } else {
          var nativeColor = processedColor;
          if (_this2.nativeColor !== nativeColor) {
            _this2.nativeColor = nativeColor;
            shouldUpdateNodeConfig = true;
          }
        }
      });
      if (this.__isNative) {
        var _nativeTag = this.__getNativeTag();
        if (shouldUpdateNodeConfig) {
          NativeAnimatedAPI.updateAnimatedNodeConfig(_nativeTag, this.__getNativeConfig());
        }
        NativeAnimatedAPI.unsetWaitingForIdentifier(_nativeTag.toString());
      } else {
        (0, _AnimatedValue.flushValue)(this);
      }
      this.__callListeners(this.__getValue());
    }
  }, {
    key: "setOffset",
    value: function setOffset(offset) {
      this.r.setOffset(offset.r);
      this.g.setOffset(offset.g);
      this.b.setOffset(offset.b);
      this.a.setOffset(offset.a);
    }
  }, {
    key: "flattenOffset",
    value: function flattenOffset() {
      this.r.flattenOffset();
      this.g.flattenOffset();
      this.b.flattenOffset();
      this.a.flattenOffset();
    }
  }, {
    key: "extractOffset",
    value: function extractOffset() {
      this.r.extractOffset();
      this.g.extractOffset();
      this.b.extractOffset();
      this.a.extractOffset();
    }
  }, {
    key: "stopAnimation",
    value: function stopAnimation(callback) {
      this.r.stopAnimation();
      this.g.stopAnimation();
      this.b.stopAnimation();
      this.a.stopAnimation();
      callback && callback(this.__getValue());
    }
  }, {
    key: "resetAnimation",
    value: function resetAnimation(callback) {
      this.r.resetAnimation();
      this.g.resetAnimation();
      this.b.resetAnimation();
      this.a.resetAnimation();
      callback && callback(this.__getValue());
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      if (this.nativeColor != null) {
        return this.nativeColor;
      } else {
        return `rgba(${this.r.__getValue()}, ${this.g.__getValue()}, ${this.b.__getValue()}, ${this.a.__getValue()})`;
      }
    }
  }, {
    key: "__attach",
    value: function __attach() {
      this.r.__addChild(this);
      this.g.__addChild(this);
      this.b.__addChild(this);
      this.a.__addChild(this);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedColor.prototype), "__attach", this).call(this);
    }
  }, {
    key: "__detach",
    value: function __detach() {
      this.r.__removeChild(this);
      this.g.__removeChild(this);
      this.b.__removeChild(this);
      this.a.__removeChild(this);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedColor.prototype), "__detach", this).call(this);
    }
  }, {
    key: "_withSuspendedCallbacks",
    value: function _withSuspendedCallbacks(callback) {
      this._suspendCallbacks++;
      callback();
      this._suspendCallbacks--;
    }
  }, {
    key: "__callListeners",
    value: function __callListeners(value) {
      if (this._suspendCallbacks === 0) {
        (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedColor.prototype), "__callListeners", this).call(this, value);
      }
    }
  }, {
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      this.r.__makeNative(platformConfig);
      this.g.__makeNative(platformConfig);
      this.b.__makeNative(platformConfig);
      this.a.__makeNative(platformConfig);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedColor.prototype), "__makeNative", this).call(this, platformConfig);
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      return {
        type: 'color',
        r: this.r.__getNativeTag(),
        g: this.g.__getNativeTag(),
        b: this.b.__getNativeTag(),
        a: this.a.__getNativeTag(),
        nativeColor: this.nativeColor
      };
    }
  }]);
  return AnimatedColor;
}(_AnimatedWithChildren2.default);
exports.default = AnimatedColor;
//# sourceMappingURL=AnimatedColor.js.map