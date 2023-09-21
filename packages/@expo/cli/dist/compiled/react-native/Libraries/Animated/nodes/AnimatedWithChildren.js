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
var AnimatedWithChildren = function (_AnimatedNode) {
  (0, _inherits2.default)(AnimatedWithChildren, _AnimatedNode);
  var _super = _createSuper(AnimatedWithChildren);
  function AnimatedWithChildren() {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedWithChildren);
    _this = _super.call(this);
    _this._children = [];
    return _this;
  }
  (0, _createClass2.default)(AnimatedWithChildren, [{
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      if (!this.__isNative) {
        this.__isNative = true;
        for (var child of this._children) {
          child.__makeNative(platformConfig);
          _NativeAnimatedHelper.default.API.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
        }
      }
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedWithChildren.prototype), "__makeNative", this).call(this, platformConfig);
    }
  }, {
    key: "__addChild",
    value: function __addChild(child) {
      if (this._children.length === 0) {
        this.__attach();
      }
      this._children.push(child);
      if (this.__isNative) {
        child.__makeNative(this.__getPlatformConfig());
        _NativeAnimatedHelper.default.API.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
      }
    }
  }, {
    key: "__removeChild",
    value: function __removeChild(child) {
      var index = this._children.indexOf(child);
      if (index === -1) {
        console.warn("Trying to remove a child that doesn't exist");
        return;
      }
      if (this.__isNative && child.__isNative) {
        _NativeAnimatedHelper.default.API.disconnectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
      }
      this._children.splice(index, 1);
      if (this._children.length === 0) {
        this.__detach();
      }
    }
  }, {
    key: "__getChildren",
    value: function __getChildren() {
      return this._children;
    }
  }, {
    key: "__callListeners",
    value: function __callListeners(value) {
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedWithChildren.prototype), "__callListeners", this).call(this, value);
      if (!this.__isNative) {
        for (var child of this._children) {
          if (child.__getValue) {
            child.__callListeners(child.__getValue());
          }
        }
      }
    }
  }]);
  return AnimatedWithChildren;
}(_AnimatedNode2.default);
exports.default = AnimatedWithChildren;