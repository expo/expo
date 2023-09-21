'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _View = _interopRequireDefault(require("../Components/View/View"));
var _flattenStyle = _interopRequireDefault(require("../StyleSheet/flattenStyle"));
var _StyleSheet = _interopRequireDefault(require("../StyleSheet/StyleSheet"));
var _Image = _interopRequireDefault(require("./Image"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["children", "style", "imageStyle", "imageRef", "importantForAccessibility"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ImageBackground = function (_React$Component) {
  (0, _inherits2.default)(ImageBackground, _React$Component);
  var _super = _createSuper(ImageBackground);
  function ImageBackground() {
    var _this;
    (0, _classCallCheck2.default)(this, ImageBackground);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this._viewRef = null;
    _this._captureRef = function (ref) {
      _this._viewRef = ref;
    };
    return _this;
  }
  (0, _createClass2.default)(ImageBackground, [{
    key: "setNativeProps",
    value: function setNativeProps(props) {
      var viewRef = this._viewRef;
      if (viewRef) {
        viewRef.setNativeProps(props);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
        children = _this$props.children,
        style = _this$props.style,
        imageStyle = _this$props.imageStyle,
        imageRef = _this$props.imageRef,
        importantForAccessibility = _this$props.importantForAccessibility,
        props = (0, _objectWithoutProperties2.default)(_this$props, _excluded);
      var flattenedStyle = (0, _flattenStyle.default)(style);
      return (0, _jsxRuntime.jsxs)(_View.default, {
        accessibilityIgnoresInvertColors: true,
        importantForAccessibility: importantForAccessibility,
        style: style,
        ref: this._captureRef,
        children: [(0, _jsxRuntime.jsx)(_Image.default, Object.assign({}, props, {
          importantForAccessibility: importantForAccessibility,
          style: [_StyleSheet.default.absoluteFill, {
            width: flattenedStyle == null ? void 0 : flattenedStyle.width,
            height: flattenedStyle == null ? void 0 : flattenedStyle.height
          }, imageStyle],
          ref: imageRef
        })), children]
      });
    }
  }]);
  return ImageBackground;
}(React.Component);
module.exports = ImageBackground;