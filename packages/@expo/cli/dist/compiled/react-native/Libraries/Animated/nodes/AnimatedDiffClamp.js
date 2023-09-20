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
var _AnimatedInterpolation = _interopRequireDefault(require("./AnimatedInterpolation"));
var _AnimatedWithChildren2 = _interopRequireDefault(require("./AnimatedWithChildren"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var AnimatedDiffClamp = function (_AnimatedWithChildren) {
  (0, _inherits2.default)(AnimatedDiffClamp, _AnimatedWithChildren);
  var _super = _createSuper(AnimatedDiffClamp);
  function AnimatedDiffClamp(a, min, max) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedDiffClamp);
    _this = _super.call(this);
    _this._a = a;
    _this._min = min;
    _this._max = max;
    _this._value = _this._lastValue = _this._a.__getValue();
    return _this;
  }
  (0, _createClass2.default)(AnimatedDiffClamp, [{
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      this._a.__makeNative(platformConfig);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedDiffClamp.prototype), "__makeNative", this).call(this, platformConfig);
    }
  }, {
    key: "interpolate",
    value: function interpolate(config) {
      return new _AnimatedInterpolation.default(this, config);
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      var value = this._a.__getValue();
      var diff = value - this._lastValue;
      this._lastValue = value;
      this._value = Math.min(Math.max(this._value + diff, this._min), this._max);
      return this._value;
    }
  }, {
    key: "__attach",
    value: function __attach() {
      this._a.__addChild(this);
    }
  }, {
    key: "__detach",
    value: function __detach() {
      this._a.__removeChild(this);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedDiffClamp.prototype), "__detach", this).call(this);
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      return {
        type: 'diffclamp',
        input: this._a.__getNativeTag(),
        min: this._min,
        max: this._max
      };
    }
  }]);
  return AnimatedDiffClamp;
}(_AnimatedWithChildren2.default);
exports.default = AnimatedDiffClamp;
//# sourceMappingURL=AnimatedDiffClamp.js.map