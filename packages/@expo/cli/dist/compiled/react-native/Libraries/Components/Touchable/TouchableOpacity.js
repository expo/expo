var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _Animated = _interopRequireDefault(require("../../Animated/Animated"));
var _Easing = _interopRequireDefault(require("../../Animated/Easing"));
var _Pressability = _interopRequireDefault(require("../../Pressability/Pressability"));
var _PressabilityDebug = require("../../Pressability/PressabilityDebug");
var _flattenStyle4 = _interopRequireDefault(require("../../StyleSheet/flattenStyle"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["onBlur", "onFocus"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var TouchableOpacity = function (_React$Component) {
  (0, _inherits2.default)(TouchableOpacity, _React$Component);
  var _super = _createSuper(TouchableOpacity);
  function TouchableOpacity() {
    var _this;
    (0, _classCallCheck2.default)(this, TouchableOpacity);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.state = {
      anim: new _Animated.default.Value(_this._getChildStyleOpacityWithDefault()),
      pressability: new _Pressability.default(_this._createPressabilityConfig())
    };
    return _this;
  }
  (0, _createClass2.default)(TouchableOpacity, [{
    key: "_createPressabilityConfig",
    value: function _createPressabilityConfig() {
      var _ref,
        _this$props$disabled,
        _this$props$accessibi,
        _this2 = this;
      return {
        cancelable: !this.props.rejectResponderTermination,
        disabled: (_ref = (_this$props$disabled = this.props.disabled) != null ? _this$props$disabled : this.props['aria-disabled']) != null ? _ref : (_this$props$accessibi = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi.disabled,
        hitSlop: this.props.hitSlop,
        delayLongPress: this.props.delayLongPress,
        delayPressIn: this.props.delayPressIn,
        delayPressOut: this.props.delayPressOut,
        minPressDuration: 0,
        pressRectOffset: this.props.pressRetentionOffset,
        onBlur: function onBlur(event) {
          if (_Platform.default.isTV) {
            _this2._opacityInactive(250);
          }
          if (_this2.props.onBlur != null) {
            _this2.props.onBlur(event);
          }
        },
        onFocus: function onFocus(event) {
          if (_Platform.default.isTV) {
            _this2._opacityActive(150);
          }
          if (_this2.props.onFocus != null) {
            _this2.props.onFocus(event);
          }
        },
        onLongPress: this.props.onLongPress,
        onPress: this.props.onPress,
        onPressIn: function onPressIn(event) {
          _this2._opacityActive(event.dispatchConfig.registrationName === 'onResponderGrant' ? 0 : 150);
          if (_this2.props.onPressIn != null) {
            _this2.props.onPressIn(event);
          }
        },
        onPressOut: function onPressOut(event) {
          _this2._opacityInactive(250);
          if (_this2.props.onPressOut != null) {
            _this2.props.onPressOut(event);
          }
        }
      };
    }
  }, {
    key: "_setOpacityTo",
    value: function _setOpacityTo(toValue, duration) {
      _Animated.default.timing(this.state.anim, {
        toValue: toValue,
        duration: duration,
        easing: _Easing.default.inOut(_Easing.default.quad),
        useNativeDriver: true
      }).start();
    }
  }, {
    key: "_opacityActive",
    value: function _opacityActive(duration) {
      var _this$props$activeOpa;
      this._setOpacityTo((_this$props$activeOpa = this.props.activeOpacity) != null ? _this$props$activeOpa : 0.2, duration);
    }
  }, {
    key: "_opacityInactive",
    value: function _opacityInactive(duration) {
      this._setOpacityTo(this._getChildStyleOpacityWithDefault(), duration);
    }
  }, {
    key: "_getChildStyleOpacityWithDefault",
    value: function _getChildStyleOpacityWithDefault() {
      var _flattenStyle;
      var opacity = (_flattenStyle = (0, _flattenStyle4.default)(this.props.style)) == null ? void 0 : _flattenStyle.opacity;
      return typeof opacity === 'number' ? opacity : 1;
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props$ariaBusy, _this$props$accessibi2, _this$props$ariaChec, _this$props$accessibi3, _this$props$ariaDisa, _this$props$accessibi4, _this$props$ariaExpa, _this$props$accessibi5, _this$props$ariaSele, _this$props$accessibi6, _this$props$ariaValu, _this$props$accessibi7, _this$props$ariaValu2, _this$props$accessibi8, _this$props$ariaValu3, _this$props$accessibi9, _this$props$ariaValu4, _this$props$accessibi10, _this$props$ariaLive, _this$props$ariaLabe, _this$props$ariaModa, _this$props$ariaHidd;
      var _this$state$pressabil = this.state.pressability.getEventHandlers(),
        onBlur = _this$state$pressabil.onBlur,
        onFocus = _this$state$pressabil.onFocus,
        eventHandlersWithoutBlurAndFocus = (0, _objectWithoutProperties2.default)(_this$state$pressabil, _excluded);
      var _accessibilityState = {
        busy: (_this$props$ariaBusy = this.props['aria-busy']) != null ? _this$props$ariaBusy : (_this$props$accessibi2 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi2.busy,
        checked: (_this$props$ariaChec = this.props['aria-checked']) != null ? _this$props$ariaChec : (_this$props$accessibi3 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi3.checked,
        disabled: (_this$props$ariaDisa = this.props['aria-disabled']) != null ? _this$props$ariaDisa : (_this$props$accessibi4 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi4.disabled,
        expanded: (_this$props$ariaExpa = this.props['aria-expanded']) != null ? _this$props$ariaExpa : (_this$props$accessibi5 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi5.expanded,
        selected: (_this$props$ariaSele = this.props['aria-selected']) != null ? _this$props$ariaSele : (_this$props$accessibi6 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi6.selected
      };
      _accessibilityState = this.props.disabled != null ? Object.assign({}, _accessibilityState, {
        disabled: this.props.disabled
      }) : _accessibilityState;
      var accessibilityValue = {
        max: (_this$props$ariaValu = this.props['aria-valuemax']) != null ? _this$props$ariaValu : (_this$props$accessibi7 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi7.max,
        min: (_this$props$ariaValu2 = this.props['aria-valuemin']) != null ? _this$props$ariaValu2 : (_this$props$accessibi8 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi8.min,
        now: (_this$props$ariaValu3 = this.props['aria-valuenow']) != null ? _this$props$ariaValu3 : (_this$props$accessibi9 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi9.now,
        text: (_this$props$ariaValu4 = this.props['aria-valuetext']) != null ? _this$props$ariaValu4 : (_this$props$accessibi10 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi10.text
      };
      var accessibilityLiveRegion = this.props['aria-live'] === 'off' ? 'none' : (_this$props$ariaLive = this.props['aria-live']) != null ? _this$props$ariaLive : this.props.accessibilityLiveRegion;
      var accessibilityLabel = (_this$props$ariaLabe = this.props['aria-label']) != null ? _this$props$ariaLabe : this.props.accessibilityLabel;
      return (0, _jsxRuntime.jsxs)(_Animated.default.View, Object.assign({
        accessible: this.props.accessible !== false,
        accessibilityLabel: accessibilityLabel,
        accessibilityHint: this.props.accessibilityHint,
        accessibilityLanguage: this.props.accessibilityLanguage,
        accessibilityRole: this.props.accessibilityRole,
        accessibilityState: _accessibilityState,
        accessibilityActions: this.props.accessibilityActions,
        onAccessibilityAction: this.props.onAccessibilityAction,
        accessibilityValue: accessibilityValue,
        importantForAccessibility: this.props['aria-hidden'] === true ? 'no-hide-descendants' : this.props.importantForAccessibility,
        accessibilityViewIsModal: (_this$props$ariaModa = this.props['aria-modal']) != null ? _this$props$ariaModa : this.props.accessibilityViewIsModal,
        accessibilityLiveRegion: accessibilityLiveRegion,
        accessibilityElementsHidden: (_this$props$ariaHidd = this.props['aria-hidden']) != null ? _this$props$ariaHidd : this.props.accessibilityElementsHidden,
        style: [this.props.style, {
          opacity: this.state.anim
        }],
        nativeID: this.props.nativeID,
        testID: this.props.testID,
        onLayout: this.props.onLayout,
        nextFocusDown: this.props.nextFocusDown,
        nextFocusForward: this.props.nextFocusForward,
        nextFocusLeft: this.props.nextFocusLeft,
        nextFocusRight: this.props.nextFocusRight,
        nextFocusUp: this.props.nextFocusUp,
        hasTVPreferredFocus: this.props.hasTVPreferredFocus,
        hitSlop: this.props.hitSlop,
        focusable: this.props.focusable !== false && this.props.onPress !== undefined,
        ref: this.props.hostRef
      }, eventHandlersWithoutBlurAndFocus, {
        children: [this.props.children, __DEV__ ? (0, _jsxRuntime.jsx)(_PressabilityDebug.PressabilityDebugView, {
          color: "cyan",
          hitSlop: this.props.hitSlop
        }) : null]
      }));
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState) {
      var _flattenStyle2, _flattenStyle3;
      this.state.pressability.configure(this._createPressabilityConfig());
      if (this.props.disabled !== prevProps.disabled || ((_flattenStyle2 = (0, _flattenStyle4.default)(prevProps.style)) == null ? void 0 : _flattenStyle2.opacity) !== ((_flattenStyle3 = (0, _flattenStyle4.default)(this.props.style)) == null ? void 0 : _flattenStyle3.opacity)) {
        this._opacityInactive(250);
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.state.pressability.reset();
    }
  }]);
  return TouchableOpacity;
}(React.Component);
var Touchable = React.forwardRef(function (props, ref) {
  return (0, _jsxRuntime.jsx)(TouchableOpacity, Object.assign({}, props, {
    hostRef: ref
  }));
});
Touchable.displayName = 'TouchableOpacity';
module.exports = Touchable;
//# sourceMappingURL=TouchableOpacity.js.map