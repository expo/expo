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
var _AnimatedValue = _interopRequireDefault(require("./AnimatedValue"));
var _AnimatedWithChildren2 = _interopRequireDefault(require("./AnimatedWithChildren"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var AnimatedMultiplication = function (_AnimatedWithChildren) {
  (0, _inherits2.default)(AnimatedMultiplication, _AnimatedWithChildren);
  var _super = _createSuper(AnimatedMultiplication);
  function AnimatedMultiplication(a, b) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedMultiplication);
    _this = _super.call(this);
    _this._a = typeof a === 'number' ? new _AnimatedValue.default(a) : a;
    _this._b = typeof b === 'number' ? new _AnimatedValue.default(b) : b;
    return _this;
  }
  (0, _createClass2.default)(AnimatedMultiplication, [{
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      this._a.__makeNative(platformConfig);
      this._b.__makeNative(platformConfig);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedMultiplication.prototype), "__makeNative", this).call(this, platformConfig);
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      return this._a.__getValue() * this._b.__getValue();
    }
  }, {
    key: "interpolate",
    value: function interpolate(config) {
      return new _AnimatedInterpolation.default(this, config);
    }
  }, {
    key: "__attach",
    value: function __attach() {
      this._a.__addChild(this);
      this._b.__addChild(this);
    }
  }, {
    key: "__detach",
    value: function __detach() {
      this._a.__removeChild(this);
      this._b.__removeChild(this);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedMultiplication.prototype), "__detach", this).call(this);
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      return {
        type: 'multiplication',
        input: [this._a.__getNativeTag(), this._b.__getNativeTag()]
      };
    }
  }]);
  return AnimatedMultiplication;
}(_AnimatedWithChildren2.default);
exports.default = AnimatedMultiplication;
//# sourceMappingURL=AnimatedMultiplication.js.map