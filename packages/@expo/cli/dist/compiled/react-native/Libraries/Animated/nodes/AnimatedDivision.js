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
var _AnimatedNode = _interopRequireDefault(require("./AnimatedNode"));
var _AnimatedValue = _interopRequireDefault(require("./AnimatedValue"));
var _AnimatedWithChildren2 = _interopRequireDefault(require("./AnimatedWithChildren"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var AnimatedDivision = function (_AnimatedWithChildren) {
  (0, _inherits2.default)(AnimatedDivision, _AnimatedWithChildren);
  var _super = _createSuper(AnimatedDivision);
  function AnimatedDivision(a, b) {
    var _this;
    (0, _classCallCheck2.default)(this, AnimatedDivision);
    _this = _super.call(this);
    _this._warnedAboutDivideByZero = false;
    if (b === 0 || b instanceof _AnimatedNode.default && b.__getValue() === 0) {
      console.error('Detected potential division by zero in AnimatedDivision');
    }
    _this._a = typeof a === 'number' ? new _AnimatedValue.default(a) : a;
    _this._b = typeof b === 'number' ? new _AnimatedValue.default(b) : b;
    return _this;
  }
  (0, _createClass2.default)(AnimatedDivision, [{
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      this._a.__makeNative(platformConfig);
      this._b.__makeNative(platformConfig);
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedDivision.prototype), "__makeNative", this).call(this, platformConfig);
    }
  }, {
    key: "__getValue",
    value: function __getValue() {
      var a = this._a.__getValue();
      var b = this._b.__getValue();
      if (b === 0) {
        if (!this._warnedAboutDivideByZero) {
          console.error('Detected division by zero in AnimatedDivision');
          this._warnedAboutDivideByZero = true;
        }
        return 0;
      }
      this._warnedAboutDivideByZero = false;
      return a / b;
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
      (0, _get2.default)((0, _getPrototypeOf2.default)(AnimatedDivision.prototype), "__detach", this).call(this);
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      return {
        type: 'division',
        input: [this._a.__getNativeTag(), this._b.__getNativeTag()]
      };
    }
  }]);
  return AnimatedDivision;
}(_AnimatedWithChildren2.default);
exports.default = AnimatedDivision;
//# sourceMappingURL=AnimatedDivision.js.map