'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.flushValue = flushValue;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _InteractionManager = _interopRequireDefault(require("../../Interaction/InteractionManager"));
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var _AnimatedInterpolation = _interopRequireDefault(require("./AnimatedInterpolation"));
var _AnimatedWithChildren2 = _interopRequireDefault(require("./AnimatedWithChildren"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var NativeAnimatedAPI = _NativeAnimatedHelper.default.API;
function flushValue(rootNode) {
  var leaves = new Set();
  function findAnimatedStyles(node) {
    if (typeof node.update === 'function') {
      leaves.add(node);
    } else {
      node.__getChildren().forEach(findAnimatedStyles);
    }
  }
  findAnimatedStyles(rootNode);
  leaves.forEach(function (leaf) {
    return leaf.update();
  });
}
function _executeAsAnimatedBatch(id, operation) {
  NativeAnimatedAPI.setWaitingForIdentifier(id);
  operation();
  NativeAnimatedAPI.unsetWaitingForIdentifier(id);
}
var AnimatedValue = function (_AnimatedWithChildren) {
  (0, _inherits2.default)(AnimatedValue, _AnimatedWithChildren);
  var _super = _createSuper(AnimatedValue);
  function AnimatedValue(value, config) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedValue);
    _this = _super.call(this);
    if (typeof value !== 'number') {
      throw new Error('AnimatedValue: Attempting to set value to undefined');
    }
    _this._startingValue = _this._value = value;
    _this._offset = 0;
    _this._animation = null;
    if (config && config.useNativeDriver) {
      _this.__makeNative();
    }
    return _this;
  }
  (0, _createClass2.default)(AnimatedValue, [{
    key: "__detach",
    value: function __detach() {
      var _this2 = this;
      if (this.__isNative) {
        NativeAnimatedAPI.getValue(this.__getNativeTag(), function (value) {
          _this2._value = value - _this2._offset;
        });
      }
      this.stopAnimation();
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedValue.prototype), "__detach", this).call(this);
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      return this._value + this._offset;
    }
  }, {
    key: "setValue",
    value: function setValue(value) {
      var _this3 = this;
      if (this._animation) {
        this._animation.stop();
        this._animation = null;
      }
      this._updateValue(value, !this.__isNative);
      if (this.__isNative) {
        _executeAsAnimatedBatch(this.__getNativeTag().toString(), function () {
          return NativeAnimatedAPI.setAnimatedNodeValue(_this3.__getNativeTag(), value);
        });
      }
    }
  }, {
    key: "setOffset",
    value: function setOffset(offset) {
      this._offset = offset;
      if (this.__isNative) {
        NativeAnimatedAPI.setAnimatedNodeOffset(this.__getNativeTag(), offset);
      }
    }
  }, {
    key: "flattenOffset",
    value: function flattenOffset() {
      this._value += this._offset;
      this._offset = 0;
      if (this.__isNative) {
        NativeAnimatedAPI.flattenAnimatedNodeOffset(this.__getNativeTag());
      }
    }
  }, {
    key: "extractOffset",
    value: function extractOffset() {
      this._offset += this._value;
      this._value = 0;
      if (this.__isNative) {
        NativeAnimatedAPI.extractAnimatedNodeOffset(this.__getNativeTag());
      }
    }
  }, {
    key: "stopAnimation",
    value: function stopAnimation(callback) {
      this.stopTracking();
      this._animation && this._animation.stop();
      this._animation = null;
      if (callback) {
        if (this.__isNative) {
          NativeAnimatedAPI.getValue(this.__getNativeTag(), callback);
        } else {
          callback(this.__getValue());
        }
      }
    }
  }, {
    key: "resetAnimation",
    value: function resetAnimation(callback) {
      this.stopAnimation(callback);
      this._value = this._startingValue;
      if (this.__isNative) {
        NativeAnimatedAPI.setAnimatedNodeValue(this.__getNativeTag(), this._startingValue);
      }
    }
  }, {
    key: "__onAnimatedValueUpdateReceived",
    value: function __onAnimatedValueUpdateReceived(value) {
      this._updateValue(value, false);
    }
  }, {
    key: "interpolate",
    value: function interpolate(config) {
      return new _AnimatedInterpolation.default(this, config);
    }
  }, {
    key: "animate",
    value: function animate(animation, callback) {
      var _this4 = this;
      var handle = null;
      if (animation.__isInteraction) {
        handle = _InteractionManager.default.createInteractionHandle();
      }
      var previousAnimation = this._animation;
      this._animation && this._animation.stop();
      this._animation = animation;
      animation.start(this._value, function (value) {
        _this4._updateValue(value, true);
      }, function (result) {
        _this4._animation = null;
        if (handle !== null) {
          _InteractionManager.default.clearInteractionHandle(handle);
        }
        callback && callback(result);
      }, previousAnimation, this);
    }
  }, {
    key: "stopTracking",
    value: function stopTracking() {
      this._tracking && this._tracking.__detach();
      this._tracking = null;
    }
  }, {
    key: "track",
    value: function track(tracking) {
      this.stopTracking();
      this._tracking = tracking;
      this._tracking && this._tracking.update();
    }
  }, {
    key: "_updateValue",
    value: function _updateValue(value, flush) {
      if (value === undefined) {
        throw new Error('AnimatedValue: Attempting to set value to undefined');
      }
      this._value = value;
      if (flush) {
        flushValue(this);
      }
      this.__callListeners(this.__getValue());
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      return {
        type: 'value',
        value: this._value,
        offset: this._offset
      };
    }
  }]);
  return AnimatedValue;
}(_AnimatedWithChildren2.default);
exports.default = AnimatedValue;