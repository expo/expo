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
var _AnimatedValue = _interopRequireDefault(require("./AnimatedValue"));
var _AnimatedWithChildren2 = _interopRequireDefault(require("./AnimatedWithChildren"));
var _invariant = _interopRequireDefault(require("invariant"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var _uniqueId = 1;
var AnimatedValueXY = function (_AnimatedWithChildren) {
  (0, _inherits2.default)(AnimatedValueXY, _AnimatedWithChildren);
  var _super = _createSuper(AnimatedValueXY);
  function AnimatedValueXY(valueIn, config) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedValueXY);
    _this = _super.call(this);
    var value = valueIn || {
      x: 0,
      y: 0
    };
    if (typeof value.x === 'number' && typeof value.y === 'number') {
      _this.x = new _AnimatedValue.default(value.x);
      _this.y = new _AnimatedValue.default(value.y);
    } else {
      (0, _invariant.default)(value.x instanceof _AnimatedValue.default && value.y instanceof _AnimatedValue.default, 'AnimatedValueXY must be initialized with an object of numbers or ' + 'AnimatedValues.');
      _this.x = value.x;
      _this.y = value.y;
    }
    _this._listeners = {};
    if (config && config.useNativeDriver) {
      _this.__makeNative();
    }
    return _this;
  }
  (0, _createClass2.default)(AnimatedValueXY, [{
    key: "setValue",
    value: function setValue(value) {
      this.x.setValue(value.x);
      this.y.setValue(value.y);
    }
  }, {
    key: "setOffset",
    value: function setOffset(offset) {
      this.x.setOffset(offset.x);
      this.y.setOffset(offset.y);
    }
  }, {
    key: "flattenOffset",
    value: function flattenOffset() {
      this.x.flattenOffset();
      this.y.flattenOffset();
    }
  }, {
    key: "extractOffset",
    value: function extractOffset() {
      this.x.extractOffset();
      this.y.extractOffset();
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      return {
        x: this.x.__getValue(),
        y: this.y.__getValue()
      };
    }
  }, {
    key: "resetAnimation",
    value: function resetAnimation(callback) {
      this.x.resetAnimation();
      this.y.resetAnimation();
      callback && callback(this.__getValue());
    }
  }, {
    key: "stopAnimation",
    value: function stopAnimation(callback) {
      this.x.stopAnimation();
      this.y.stopAnimation();
      callback && callback(this.__getValue());
    }
  }, {
    key: "addListener",
    value: function addListener(callback) {
      var _this2 = this;
      var id = String(_uniqueId++);
      var jointCallback = function jointCallback(_ref) {
        var number = _ref.value;
        callback(_this2.__getValue());
      };
      this._listeners[id] = {
        x: this.x.addListener(jointCallback),
        y: this.y.addListener(jointCallback)
      };
      return id;
    }
  }, {
    key: "removeListener",
    value: function removeListener(id) {
      this.x.removeListener(this._listeners[id].x);
      this.y.removeListener(this._listeners[id].y);
      delete this._listeners[id];
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners() {
      this.x.removeAllListeners();
      this.y.removeAllListeners();
      this._listeners = {};
    }
  }, {
    key: "getLayout",
    value: function getLayout() {
      return {
        left: this.x,
        top: this.y
      };
    }
  }, {
    key: "getTranslateTransform",
    value: function getTranslateTransform() {
      return [{
        translateX: this.x
      }, {
        translateY: this.y
      }];
    }
  }, {
    key: "__attach",
    value: function __attach() {
      this.x.__addChild(this);
      this.y.__addChild(this);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedValueXY.prototype), "__attach", this).call(this);
    }
  }, {
    key: "__detach",
    value: function __detach() {
      this.x.__removeChild(this);
      this.y.__removeChild(this);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedValueXY.prototype), "__detach", this).call(this);
    }
  }, {
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      this.x.__makeNative(platformConfig);
      this.y.__makeNative(platformConfig);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedValueXY.prototype), "__makeNative", this).call(this, platformConfig);
    }
  }]);
  return AnimatedValueXY;
}(_AnimatedWithChildren2.default);
exports.default = AnimatedValueXY;