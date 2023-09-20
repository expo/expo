var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _LayoutAnimation = _interopRequireDefault(require("../../LayoutAnimation/LayoutAnimation"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _AccessibilityInfo = _interopRequireDefault(require("../AccessibilityInfo/AccessibilityInfo"));
var _View = _interopRequireDefault(require("../View/View"));
var _Keyboard = _interopRequireDefault(require("./Keyboard"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["behavior", "children", "contentContainerStyle", "enabled", "keyboardVerticalOffset", "style", "onLayout"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var KeyboardAvoidingView = function (_React$Component) {
  (0, _inherits2.default)(KeyboardAvoidingView, _React$Component);
  var _super = _createSuper(KeyboardAvoidingView);
  function KeyboardAvoidingView(props) {
    var _this;
    (0, _classCallCheck2.default)(this, KeyboardAvoidingView);
    _this = _super.call(this, props);
    _this._frame = null;
    _this._keyboardEvent = null;
    _this._subscriptions = [];
    _this._initialFrameHeight = 0;
    _this._onKeyboardChange = function (event) {
      _this._keyboardEvent = event;
      _this._updateBottomIfNecessary();
    };
    _this._onLayout = function () {
      var _ref = (0, _asyncToGenerator2.default)(function* (event) {
        var wasFrameNull = _this._frame == null;
        _this._frame = event.nativeEvent.layout;
        if (!_this._initialFrameHeight) {
          _this._initialFrameHeight = _this._frame.height;
        }
        if (wasFrameNull) {
          yield _this._updateBottomIfNecessary();
        }
        if (_this.props.onLayout) {
          _this.props.onLayout(event);
        }
      });
      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }();
    _this._updateBottomIfNecessary = (0, _asyncToGenerator2.default)(function* () {
      if (_this._keyboardEvent == null) {
        _this.setState({
          bottom: 0
        });
        return;
      }
      var _this$_keyboardEvent = _this._keyboardEvent,
        duration = _this$_keyboardEvent.duration,
        easing = _this$_keyboardEvent.easing,
        endCoordinates = _this$_keyboardEvent.endCoordinates;
      var height = yield _this._relativeKeyboardHeight(endCoordinates);
      if (_this.state.bottom === height) {
        return;
      }
      if (duration && easing) {
        _LayoutAnimation.default.configureNext({
          duration: duration > 10 ? duration : 10,
          update: {
            duration: duration > 10 ? duration : 10,
            type: _LayoutAnimation.default.Types[easing] || 'keyboard'
          }
        });
      }
      _this.setState({
        bottom: height
      });
    });
    _this.state = {
      bottom: 0
    };
    _this.viewRef = React.createRef();
    return _this;
  }
  (0, _createClass2.default)(KeyboardAvoidingView, [{
    key: "_relativeKeyboardHeight",
    value: function () {
      var _relativeKeyboardHeight2 = (0, _asyncToGenerator2.default)(function* (keyboardFrame) {
        var _this$props$keyboardV;
        var frame = this._frame;
        if (!frame || !keyboardFrame) {
          return 0;
        }
        if (_Platform.default.OS === 'ios' && keyboardFrame.screenY === 0 && (yield _AccessibilityInfo.default.prefersCrossFadeTransitions())) {
          return 0;
        }
        var keyboardY = keyboardFrame.screenY - ((_this$props$keyboardV = this.props.keyboardVerticalOffset) != null ? _this$props$keyboardV : 0);
        if (this.props.behavior === 'height') {
          return Math.max(this.state.bottom + frame.y + frame.height - keyboardY, 0);
        }
        return Math.max(frame.y + frame.height - keyboardY, 0);
      });
      function _relativeKeyboardHeight(_x2) {
        return _relativeKeyboardHeight2.apply(this, arguments);
      }
      return _relativeKeyboardHeight;
    }()
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      if (_Platform.default.OS === 'ios') {
        this._subscriptions = [_Keyboard.default.addListener('keyboardWillChangeFrame', this._onKeyboardChange)];
      } else {
        this._subscriptions = [_Keyboard.default.addListener('keyboardDidHide', this._onKeyboardChange), _Keyboard.default.addListener('keyboardDidShow', this._onKeyboardChange)];
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this._subscriptions.forEach(function (subscription) {
        subscription.remove();
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
        behavior = _this$props.behavior,
        children = _this$props.children,
        contentContainerStyle = _this$props.contentContainerStyle,
        _this$props$enabled = _this$props.enabled,
        enabled = _this$props$enabled === void 0 ? true : _this$props$enabled,
        _this$props$keyboardV2 = _this$props.keyboardVerticalOffset,
        keyboardVerticalOffset = _this$props$keyboardV2 === void 0 ? 0 : _this$props$keyboardV2,
        style = _this$props.style,
        onLayout = _this$props.onLayout,
        props = (0, _objectWithoutProperties2.default)(_this$props, _excluded);
      var bottomHeight = enabled === true ? this.state.bottom : 0;
      switch (behavior) {
        case 'height':
          var heightStyle;
          if (this._frame != null && this.state.bottom > 0) {
            heightStyle = {
              height: this._initialFrameHeight - bottomHeight,
              flex: 0
            };
          }
          return (0, _jsxRuntime.jsx)(_View.default, Object.assign({
            ref: this.viewRef,
            style: _StyleSheet.default.compose(style, heightStyle),
            onLayout: this._onLayout
          }, props, {
            children: children
          }));
        case 'position':
          return (0, _jsxRuntime.jsx)(_View.default, Object.assign({
            ref: this.viewRef,
            style: style,
            onLayout: this._onLayout
          }, props, {
            children: (0, _jsxRuntime.jsx)(_View.default, {
              style: _StyleSheet.default.compose(contentContainerStyle, {
                bottom: bottomHeight
              }),
              children: children
            })
          }));
        case 'padding':
          return (0, _jsxRuntime.jsx)(_View.default, Object.assign({
            ref: this.viewRef,
            style: _StyleSheet.default.compose(style, {
              paddingBottom: bottomHeight
            }),
            onLayout: this._onLayout
          }, props, {
            children: children
          }));
        default:
          return (0, _jsxRuntime.jsx)(_View.default, Object.assign({
            ref: this.viewRef,
            onLayout: this._onLayout,
            style: style
          }, props, {
            children: children
          }));
      }
    }
  }]);
  return KeyboardAvoidingView;
}(React.Component);
var _default = KeyboardAvoidingView;
exports.default = _default;
//# sourceMappingURL=KeyboardAvoidingView.js.map