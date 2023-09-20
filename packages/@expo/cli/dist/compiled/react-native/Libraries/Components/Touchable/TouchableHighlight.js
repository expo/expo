var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _Pressability = _interopRequireDefault(require("../../Pressability/Pressability"));
var _PressabilityDebug = require("../../Pressability/PressabilityDebug");
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["onBlur", "onFocus"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var TouchableHighlight = function (_React$Component) {
  (0, _inherits2.default)(TouchableHighlight, _React$Component);
  var _super = _createSuper(TouchableHighlight);
  function TouchableHighlight() {
    var _this;
    (0, _classCallCheck2.default)(this, TouchableHighlight);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this._isMounted = false;
    _this.state = {
      pressability: new _Pressability.default(_this._createPressabilityConfig()),
      extraStyles: _this.props.testOnly_pressed === true ? _this._createExtraStyles() : null
    };
    return _this;
  }
  (0, _createClass2.default)(TouchableHighlight, [{
    key: "_createPressabilityConfig",
    value: function _createPressabilityConfig() {
      var _this$props$accessibi,
        _this2 = this;
      return {
        cancelable: !this.props.rejectResponderTermination,
        disabled: this.props.disabled != null ? this.props.disabled : (_this$props$accessibi = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi.disabled,
        hitSlop: this.props.hitSlop,
        delayLongPress: this.props.delayLongPress,
        delayPressIn: this.props.delayPressIn,
        delayPressOut: this.props.delayPressOut,
        minPressDuration: 0,
        pressRectOffset: this.props.pressRetentionOffset,
        android_disableSound: this.props.touchSoundDisabled,
        onBlur: function onBlur(event) {
          if (_Platform.default.isTV) {
            _this2._hideUnderlay();
          }
          if (_this2.props.onBlur != null) {
            _this2.props.onBlur(event);
          }
        },
        onFocus: function onFocus(event) {
          if (_Platform.default.isTV) {
            _this2._showUnderlay();
          }
          if (_this2.props.onFocus != null) {
            _this2.props.onFocus(event);
          }
        },
        onLongPress: this.props.onLongPress,
        onPress: function onPress(event) {
          if (_this2._hideTimeout != null) {
            clearTimeout(_this2._hideTimeout);
          }
          if (!_Platform.default.isTV) {
            var _this2$props$delayPre;
            _this2._showUnderlay();
            _this2._hideTimeout = setTimeout(function () {
              _this2._hideUnderlay();
            }, (_this2$props$delayPre = _this2.props.delayPressOut) != null ? _this2$props$delayPre : 0);
          }
          if (_this2.props.onPress != null) {
            _this2.props.onPress(event);
          }
        },
        onPressIn: function onPressIn(event) {
          if (_this2._hideTimeout != null) {
            clearTimeout(_this2._hideTimeout);
            _this2._hideTimeout = null;
          }
          _this2._showUnderlay();
          if (_this2.props.onPressIn != null) {
            _this2.props.onPressIn(event);
          }
        },
        onPressOut: function onPressOut(event) {
          if (_this2._hideTimeout == null) {
            _this2._hideUnderlay();
          }
          if (_this2.props.onPressOut != null) {
            _this2.props.onPressOut(event);
          }
        }
      };
    }
  }, {
    key: "_createExtraStyles",
    value: function _createExtraStyles() {
      var _this$props$activeOpa;
      return {
        child: {
          opacity: (_this$props$activeOpa = this.props.activeOpacity) != null ? _this$props$activeOpa : 0.85
        },
        underlay: {
          backgroundColor: this.props.underlayColor === undefined ? 'black' : this.props.underlayColor
        }
      };
    }
  }, {
    key: "_showUnderlay",
    value: function _showUnderlay() {
      if (!this._isMounted || !this._hasPressHandler()) {
        return;
      }
      this.setState({
        extraStyles: this._createExtraStyles()
      });
      if (this.props.onShowUnderlay != null) {
        this.props.onShowUnderlay();
      }
    }
  }, {
    key: "_hideUnderlay",
    value: function _hideUnderlay() {
      if (this._hideTimeout != null) {
        clearTimeout(this._hideTimeout);
        this._hideTimeout = null;
      }
      if (this.props.testOnly_pressed === true) {
        return;
      }
      if (this._hasPressHandler()) {
        this.setState({
          extraStyles: null
        });
        if (this.props.onHideUnderlay != null) {
          this.props.onHideUnderlay();
        }
      }
    }
  }, {
    key: "_hasPressHandler",
    value: function _hasPressHandler() {
      return this.props.onPress != null || this.props.onPressIn != null || this.props.onPressOut != null || this.props.onLongPress != null;
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props$ariaValu, _this$props$accessibi2, _this$props$ariaValu2, _this$props$accessibi3, _this$props$ariaValu3, _this$props$accessibi4, _this$props$ariaValu4, _this$props$accessibi5, _this$props$ariaLive, _this$props$ariaLabe, _this$props$ariaModa, _this$props$ariaHidd, _this$state$extraStyl, _this$state$extraStyl2;
      var child = React.Children.only(this.props.children);
      var _this$state$pressabil = this.state.pressability.getEventHandlers(),
        onBlur = _this$state$pressabil.onBlur,
        onFocus = _this$state$pressabil.onFocus,
        eventHandlersWithoutBlurAndFocus = (0, _objectWithoutProperties2.default)(_this$state$pressabil, _excluded);
      var accessibilityState = this.props.disabled != null ? Object.assign({}, this.props.accessibilityState, {
        disabled: this.props.disabled
      }) : this.props.accessibilityState;
      var accessibilityValue = {
        max: (_this$props$ariaValu = this.props['aria-valuemax']) != null ? _this$props$ariaValu : (_this$props$accessibi2 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi2.max,
        min: (_this$props$ariaValu2 = this.props['aria-valuemin']) != null ? _this$props$ariaValu2 : (_this$props$accessibi3 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi3.min,
        now: (_this$props$ariaValu3 = this.props['aria-valuenow']) != null ? _this$props$ariaValu3 : (_this$props$accessibi4 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi4.now,
        text: (_this$props$ariaValu4 = this.props['aria-valuetext']) != null ? _this$props$ariaValu4 : (_this$props$accessibi5 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi5.text
      };
      var accessibilityLiveRegion = this.props['aria-live'] === 'off' ? 'none' : (_this$props$ariaLive = this.props['aria-live']) != null ? _this$props$ariaLive : this.props.accessibilityLiveRegion;
      var accessibilityLabel = (_this$props$ariaLabe = this.props['aria-label']) != null ? _this$props$ariaLabe : this.props.accessibilityLabel;
      return (0, _jsxRuntime.jsxs)(_View.default, Object.assign({
        accessible: this.props.accessible !== false,
        accessibilityLabel: accessibilityLabel,
        accessibilityHint: this.props.accessibilityHint,
        accessibilityLanguage: this.props.accessibilityLanguage,
        accessibilityRole: this.props.accessibilityRole,
        accessibilityState: accessibilityState,
        accessibilityValue: accessibilityValue,
        accessibilityActions: this.props.accessibilityActions,
        onAccessibilityAction: this.props.onAccessibilityAction,
        importantForAccessibility: this.props['aria-hidden'] === true ? 'no-hide-descendants' : this.props.importantForAccessibility,
        accessibilityViewIsModal: (_this$props$ariaModa = this.props['aria-modal']) != null ? _this$props$ariaModa : this.props.accessibilityViewIsModal,
        accessibilityLiveRegion: accessibilityLiveRegion,
        accessibilityElementsHidden: (_this$props$ariaHidd = this.props['aria-hidden']) != null ? _this$props$ariaHidd : this.props.accessibilityElementsHidden,
        style: _StyleSheet.default.compose(this.props.style, (_this$state$extraStyl = this.state.extraStyles) == null ? void 0 : _this$state$extraStyl.underlay),
        onLayout: this.props.onLayout,
        hitSlop: this.props.hitSlop,
        hasTVPreferredFocus: this.props.hasTVPreferredFocus,
        nextFocusDown: this.props.nextFocusDown,
        nextFocusForward: this.props.nextFocusForward,
        nextFocusLeft: this.props.nextFocusLeft,
        nextFocusRight: this.props.nextFocusRight,
        nextFocusUp: this.props.nextFocusUp,
        focusable: this.props.focusable !== false && this.props.onPress !== undefined,
        nativeID: this.props.nativeID,
        testID: this.props.testID,
        ref: this.props.hostRef
      }, eventHandlersWithoutBlurAndFocus, {
        children: [React.cloneElement(child, {
          style: _StyleSheet.default.compose(child.props.style, (_this$state$extraStyl2 = this.state.extraStyles) == null ? void 0 : _this$state$extraStyl2.child)
        }), __DEV__ ? (0, _jsxRuntime.jsx)(_PressabilityDebug.PressabilityDebugView, {
          color: "green",
          hitSlop: this.props.hitSlop
        }) : null]
      }));
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      this._isMounted = true;
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState) {
      this.state.pressability.configure(this._createPressabilityConfig());
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this._isMounted = false;
      if (this._hideTimeout != null) {
        clearTimeout(this._hideTimeout);
      }
      this.state.pressability.reset();
    }
  }]);
  return TouchableHighlight;
}(React.Component);
var Touchable = React.forwardRef(function (props, hostRef) {
  return (0, _jsxRuntime.jsx)(TouchableHighlight, Object.assign({}, props, {
    hostRef: hostRef
  }));
});
Touchable.displayName = 'TouchableHighlight';
module.exports = Touchable;
//# sourceMappingURL=TouchableHighlight.js.map