var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _EventPolyfill2 = _interopRequireDefault(require("./EventPolyfill"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var CustomEvent = function (_EventPolyfill) {
  (0, _inherits2.default)(CustomEvent, _EventPolyfill);
  var _super = _createSuper(CustomEvent);
  function CustomEvent(typeArg, options) {
    var _this;
    (0, _classCallCheck2.default)(this, CustomEvent);
    var bubbles = options.bubbles,
      cancelable = options.cancelable,
      composed = options.composed;
    _this = _super.call(this, typeArg, {
      bubbles: bubbles,
      cancelable: cancelable,
      composed: composed
    });
    _this.detail = options.detail;
    return _this;
  }
  return (0, _createClass2.default)(CustomEvent);
}(_EventPolyfill2.default);
var _default = CustomEvent;
exports.default = _default;
//# sourceMappingURL=CustomEvent.js.map