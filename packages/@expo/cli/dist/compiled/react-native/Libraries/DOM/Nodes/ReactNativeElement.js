var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _ReadOnlyElement2 = _interopRequireDefault(require("./ReadOnlyElement"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ReactNativeElement = function (_ReadOnlyElement) {
  (0, _inherits2.default)(ReactNativeElement, _ReadOnlyElement);
  var _super = _createSuper(ReactNativeElement);
  function ReactNativeElement() {
    (0, _classCallCheck2.default)(this, ReactNativeElement);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(ReactNativeElement, [{
    key: "offsetHeight",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "offsetLeft",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "offsetParent",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "offsetTop",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "offsetWidth",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "blur",
    value: function blur() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "focus",
    value: function focus() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "measure",
    value: function measure(callback) {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "measureInWindow",
    value: function measureInWindow(callback) {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "measureLayout",
    value: function measureLayout(relativeToNativeNode, onSuccess, onFail) {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "setNativeProps",
    value: function setNativeProps(nativeProps) {
      throw new TypeError('Unimplemented');
    }
  }]);
  return ReactNativeElement;
}(_ReadOnlyElement2.default);
exports.default = ReactNativeElement;