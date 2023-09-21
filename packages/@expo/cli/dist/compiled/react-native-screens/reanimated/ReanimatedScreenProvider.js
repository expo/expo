var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ReanimatedScreenProvider;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _react = _interopRequireDefault(require("react"));
var _reactNativeScreens = require("react-native-screens");
var _ReanimatedNativeStackScreen = _interopRequireDefault(require("./ReanimatedNativeStackScreen"));
var _ReanimatedScreen = _interopRequireDefault(require("./ReanimatedScreen"));
var _jsxRuntime = require("react/jsx-runtime");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ReanimatedScreenWrapper = function (_React$Component) {
  (0, _inherits2.default)(ReanimatedScreenWrapper, _React$Component);
  var _super = _createSuper(ReanimatedScreenWrapper);
  function ReanimatedScreenWrapper() {
    var _this;
    (0, _classCallCheck2.default)(this, ReanimatedScreenWrapper);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.ref = null;
    _this.setRef = function (ref) {
      _this.ref = ref;
      _this.props.onComponentRef == null ? void 0 : _this.props.onComponentRef(ref);
    };
    return _this;
  }
  (0, _createClass2.default)(ReanimatedScreenWrapper, [{
    key: "setNativeProps",
    value: function setNativeProps(props) {
      var _this$ref;
      (_this$ref = this.ref) == null ? void 0 : _this$ref.setNativeProps(props);
    }
  }, {
    key: "render",
    value: function render() {
      var ReanimatedScreen = this.props.isNativeStack ? _ReanimatedNativeStackScreen.default : _ReanimatedScreen.default;
      return (0, _jsxRuntime.jsx)(ReanimatedScreen, Object.assign({}, this.props, {
        ref: this.setRef
      }));
    }
  }]);
  return ReanimatedScreenWrapper;
}(_react.default.Component);
function ReanimatedScreenProvider(props) {
  return (0, _jsxRuntime.jsx)(_reactNativeScreens.ScreenContext.Provider, {
    value: ReanimatedScreenWrapper,
    children: props.children
  });
}