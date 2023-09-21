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
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var _AnimatedNode2 = _interopRequireDefault(require("./AnimatedNode"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var AnimatedTracking = function (_AnimatedNode) {
  (0, _inherits2.default)(AnimatedTracking, _AnimatedNode);
  var _super = _createSuper(AnimatedTracking);
  function AnimatedTracking(value, parent, animationClass, animationConfig, callback) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedTracking);
    _this = _super.call(this);
    _this._value = value;
    _this._parent = parent;
    _this._animationClass = animationClass;
    _this._animationConfig = animationConfig;
    _this._useNativeDriver = _NativeAnimatedHelper.default.shouldUseNativeDriver(animationConfig);
    _this._callback = callback;
    _this.__attach();
    return _this;
  }
  (0, _createClass2.default)(AnimatedTracking, [{
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      this.__isNative = true;
      this._parent.__makeNative(platformConfig);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedTracking.prototype), "__makeNative", this).call(this, platformConfig);
      this._value.__makeNative(platformConfig);
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      return this._parent.__getValue();
    }
  }, {
    key: "__attach",
    value: function __attach() {
      this._parent.__addChild(this);
      if (this._useNativeDriver) {
        var platformConfig = this._animationConfig.platformConfig;
        this.__makeNative(platformConfig);
      }
    }
  }, {
    key: "__detach",
    value: function __detach() {
      this._parent.__removeChild(this);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedTracking.prototype), "__detach", this).call(this);
    }
  }, {
    key: "update",
    value: function update() {
      this._value.animate(new this._animationClass(Object.assign({}, this._animationConfig, {
        toValue: this._animationConfig.toValue.__getValue()
      })), this._callback);
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      var animation = new this._animationClass(Object.assign({}, this._animationConfig, {
        toValue: undefined
      }));
      var animationConfig = animation.__getNativeAnimationConfig();
      return {
        type: 'tracking',
        animationId: _NativeAnimatedHelper.default.generateNewAnimationId(),
        animationConfig: animationConfig,
        toValue: this._parent.__getNativeTag(),
        value: this._value.__getNativeTag()
      };
    }
  }]);
  return AnimatedTracking;
}(_AnimatedNode2.default);
exports.default = AnimatedTracking;