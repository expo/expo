var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireNativeViewManager = requireNativeViewManager;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _requireNativeModule = require("./requireNativeModule");
var _jsxRuntime = require("react/jsx-runtime");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var nativeComponentsCache = new Map();
function requireCachedNativeComponent(viewName) {
  var cachedNativeComponent = nativeComponentsCache.get(viewName);
  if (!cachedNativeComponent) {
    var nativeComponent = (0, _reactNative.requireNativeComponent)(viewName);
    nativeComponentsCache.set(viewName, nativeComponent);
    return nativeComponent;
  }
  return cachedNativeComponent;
}
function requireNativeViewManager(viewName) {
  var viewManagersMetadata = _reactNative.NativeModules.NativeUnimoduleProxy.viewManagersMetadata;
  var viewManagerConfig = viewManagersMetadata == null ? void 0 : viewManagersMetadata[viewName];
  if (__DEV__ && !viewManagerConfig) {
    var exportedViewManagerNames = Object.keys(viewManagersMetadata).join(', ');
    console.warn(`The native view manager required by name (${viewName}) from NativeViewManagerAdapter isn't exported by expo-modules-core. Views of this type may not render correctly. Exported view managers: [${exportedViewManagerNames}].`);
  }
  var reactNativeViewName = `ViewManagerAdapter_${viewName}`;
  var ReactNativeComponent = requireCachedNativeComponent(reactNativeViewName);
  var NativeComponent = function (_React$PureComponent) {
    (0, _inherits2.default)(NativeComponent, _React$PureComponent);
    var _super = _createSuper(NativeComponent);
    function NativeComponent() {
      var _this;
      (0, _classCallCheck2.default)(this, NativeComponent);
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _super.call.apply(_super, [this].concat(args));
      _this.nativeTag = null;
      return _this;
    }
    (0, _createClass2.default)(NativeComponent, [{
      key: "componentDidMount",
      value: function componentDidMount() {
        this.nativeTag = (0, _reactNative.findNodeHandle)(this);
      }
    }, {
      key: "render",
      value: function render() {
        return (0, _jsxRuntime.jsx)(ReactNativeComponent, Object.assign({}, this.props));
      }
    }]);
    return NativeComponent;
  }(_react.default.PureComponent);
  NativeComponent.displayName = viewName;
  try {
    var nativeModule = (0, _requireNativeModule.requireNativeModule)(viewName);
    var nativeViewPrototype = nativeModule.ViewPrototype;
    if (nativeViewPrototype) {
      Object.assign(NativeComponent.prototype, nativeViewPrototype);
    }
  } catch (_unused) {}
  return NativeComponent;
}