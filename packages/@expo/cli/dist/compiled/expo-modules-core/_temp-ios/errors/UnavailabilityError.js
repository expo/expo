var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UnavailabilityError = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _CodedError2 = require("./CodedError");
var _Platform = _interopRequireDefault(require("../Platform"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var UnavailabilityError = function (_CodedError) {
  (0, _inherits2.default)(UnavailabilityError, _CodedError);
  var _super = _createSuper(UnavailabilityError);
  function UnavailabilityError(moduleName, propertyName) {
    (0, _classCallCheck2.default)(this, UnavailabilityError);
    return _super.call(this, 'ERR_UNAVAILABLE', `The method or property ${moduleName}.${propertyName} is not available on ${_Platform.default.OS}, are you sure you've linked all the native dependencies properly?`);
  }
  return (0, _createClass2.default)(UnavailabilityError);
}(_CodedError2.CodedError);
exports.UnavailabilityError = UnavailabilityError;