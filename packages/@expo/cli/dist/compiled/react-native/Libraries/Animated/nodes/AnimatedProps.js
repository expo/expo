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
var _RendererProxy = require("../../ReactNative/RendererProxy");
var _AnimatedEvent = require("../AnimatedEvent");
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var _AnimatedNode2 = _interopRequireDefault(require("./AnimatedNode"));
var _AnimatedStyle = _interopRequireDefault(require("./AnimatedStyle"));
var _invariant = _interopRequireDefault(require("invariant"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var AnimatedProps = function (_AnimatedNode) {
  (0, _inherits2.default)(AnimatedProps, _AnimatedNode);
  var _super = _createSuper(AnimatedProps);
  function AnimatedProps(props, callback) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedProps);
    _this = _super.call(this);
    if (props.style) {
      props = Object.assign({}, props, {
        style: new _AnimatedStyle.default(props.style)
      });
    }
    _this._props = props;
    _this._callback = callback;
    return _this;
  }
  (0, _createClass2.default)(AnimatedProps, [{
    key: "__getValue",
    value: function __getValue() {
      var props = {};
      for (var key in this._props) {
        var value = this._props[key];
        if (value instanceof _AnimatedNode2.default) {
          props[key] = value.__getValue();
        } else if (value instanceof _AnimatedEvent.AnimatedEvent) {
          props[key] = value.__getHandler();
        } else {
          props[key] = value;
        }
      }
      return props;
    }
  }, {
    key: "__getAnimatedValue",
    value: function __getAnimatedValue() {
      var props = {};
      for (var key in this._props) {
        var value = this._props[key];
        if (value instanceof _AnimatedNode2.default) {
          props[key] = value.__getAnimatedValue();
        }
      }
      return props;
    }
  }, {
    key: "__attach",
    value: function __attach() {
      for (var key in this._props) {
        var value = this._props[key];
        if (value instanceof _AnimatedNode2.default) {
          value.__addChild(this);
        }
      }
    }
  }, {
    key: "__detach",
    value: function __detach() {
      if (this.__isNative && this._animatedView) {
        this.__disconnectAnimatedView();
      }
      for (var key in this._props) {
        var value = this._props[key];
        if (value instanceof _AnimatedNode2.default) {
          value.__removeChild(this);
        }
      }
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedProps.prototype), "__detach", this).call(this);
    }
  }, {
    key: "update",
    value: function update() {
      this._callback();
    }
  }, {
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      for (var key in this._props) {
        var value = this._props[key];
        if (value instanceof _AnimatedNode2.default) {
          value.__makeNative(platformConfig);
        }
      }
      if (!this.__isNative) {
        this.__isNative = true;
        (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedProps.prototype), "__setPlatformConfig", this).call(this, platformConfig);
        if (this._animatedView) {
          this.__connectAnimatedView();
        }
      }
    }
  }, {
    key: "setNativeView",
    value: function setNativeView(animatedView) {
      if (this._animatedView === animatedView) {
        return;
      }
      this._animatedView = animatedView;
      if (this.__isNative) {
        this.__connectAnimatedView();
      }
    }
  }, {
    key: "__connectAnimatedView",
    value: function __connectAnimatedView() {
      (0, _invariant.default)(this.__isNative, 'Expected node to be marked as "native"');
      var nativeViewTag = (0, _RendererProxy.findNodeHandle)(this._animatedView);
      (0, _invariant.default)(nativeViewTag != null, 'Unable to locate attached view in the native tree');
      _NativeAnimatedHelper.default.API.connectAnimatedNodeToView(this.__getNativeTag(), nativeViewTag);
    }
  }, {
    key: "__disconnectAnimatedView",
    value: function __disconnectAnimatedView() {
      (0, _invariant.default)(this.__isNative, 'Expected node to be marked as "native"');
      var nativeViewTag = (0, _RendererProxy.findNodeHandle)(this._animatedView);
      (0, _invariant.default)(nativeViewTag != null, 'Unable to locate attached view in the native tree');
      _NativeAnimatedHelper.default.API.disconnectAnimatedNodeFromView(this.__getNativeTag(), nativeViewTag);
    }
  }, {
    key: "__restoreDefaultValues",
    value: function __restoreDefaultValues() {
      if (this.__isNative) {
        _NativeAnimatedHelper.default.API.restoreDefaultValues(this.__getNativeTag());
      }
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      var propsConfig = {};
      for (var propKey in this._props) {
        var value = this._props[propKey];
        if (value instanceof _AnimatedNode2.default) {
          value.__makeNative(this.__getPlatformConfig());
          propsConfig[propKey] = value.__getNativeTag();
        }
      }
      return {
        type: 'props',
        props: propsConfig
      };
    }
  }]);
  return AnimatedProps;
}(_AnimatedNode2.default);
exports.default = AnimatedProps;