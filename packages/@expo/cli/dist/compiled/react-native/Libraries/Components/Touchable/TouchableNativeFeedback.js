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
var _RendererProxy = require("../../ReactNative/RendererProxy");
var _processColor = _interopRequireDefault(require("../../StyleSheet/processColor"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _ViewNativeComponent = require("../View/ViewNativeComponent");
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["onBlur", "onFocus"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var TouchableNativeFeedback = function (_React$Component) {
  (0, _inherits2.default)(TouchableNativeFeedback, _React$Component);
  var _super = _createSuper(TouchableNativeFeedback);
  function TouchableNativeFeedback() {
    var _this;
    (0, _classCallCheck2.default)(this, TouchableNativeFeedback);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.state = {
      pressability: new _Pressability.default(_this._createPressabilityConfig())
    };
    return _this;
  }
  (0, _createClass2.default)(TouchableNativeFeedback, [{
    key: "_createPressabilityConfig",
    value: function _createPressabilityConfig() {
      var _this$props$ariaDisa,
        _this$props$accessibi,
        _this2 = this;
      var accessibilityStateDisabled = (_this$props$ariaDisa = this.props['aria-disabled']) != null ? _this$props$ariaDisa : (_this$props$accessibi = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi.disabled;
      return {
        cancelable: !this.props.rejectResponderTermination,
        disabled: this.props.disabled != null ? this.props.disabled : accessibilityStateDisabled,
        hitSlop: this.props.hitSlop,
        delayLongPress: this.props.delayLongPress,
        delayPressIn: this.props.delayPressIn,
        delayPressOut: this.props.delayPressOut,
        minPressDuration: 0,
        pressRectOffset: this.props.pressRetentionOffset,
        android_disableSound: this.props.touchSoundDisabled,
        onLongPress: this.props.onLongPress,
        onPress: this.props.onPress,
        onPressIn: function onPressIn(event) {
          if (_Platform.default.OS === 'android') {
            _this2._dispatchHotspotUpdate(event);
            _this2._dispatchPressedStateChange(true);
          }
          if (_this2.props.onPressIn != null) {
            _this2.props.onPressIn(event);
          }
        },
        onPressMove: function onPressMove(event) {
          if (_Platform.default.OS === 'android') {
            _this2._dispatchHotspotUpdate(event);
          }
        },
        onPressOut: function onPressOut(event) {
          if (_Platform.default.OS === 'android') {
            _this2._dispatchPressedStateChange(false);
          }
          if (_this2.props.onPressOut != null) {
            _this2.props.onPressOut(event);
          }
        }
      };
    }
  }, {
    key: "_dispatchPressedStateChange",
    value: function _dispatchPressedStateChange(pressed) {
      if (_Platform.default.OS === 'android') {
        var hostComponentRef = (0, _RendererProxy.findHostInstance_DEPRECATED)(this);
        if (hostComponentRef == null) {
          console.warn('Touchable: Unable to find HostComponent instance. ' + 'Has your Touchable component been unmounted?');
        } else {
          _ViewNativeComponent.Commands.setPressed(hostComponentRef, pressed);
        }
      }
    }
  }, {
    key: "_dispatchHotspotUpdate",
    value: function _dispatchHotspotUpdate(event) {
      if (_Platform.default.OS === 'android') {
        var _event$nativeEvent = event.nativeEvent,
          locationX = _event$nativeEvent.locationX,
          locationY = _event$nativeEvent.locationY;
        var hostComponentRef = (0, _RendererProxy.findHostInstance_DEPRECATED)(this);
        if (hostComponentRef == null) {
          console.warn('Touchable: Unable to find HostComponent instance. ' + 'Has your Touchable component been unmounted?');
        } else {
          _ViewNativeComponent.Commands.hotspotUpdate(hostComponentRef, locationX != null ? locationX : 0, locationY != null ? locationY : 0);
        }
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props$ariaBusy, _this$props$accessibi2, _this$props$ariaChec, _this$props$accessibi3, _this$props$ariaDisa2, _this$props$accessibi4, _this$props$ariaExpa, _this$props$accessibi5, _this$props$ariaSele, _this$props$accessibi6, _this$props$ariaValu, _this$props$accessibi7, _this$props$ariaValu2, _this$props$accessibi8, _this$props$ariaValu3, _this$props$accessibi9, _this$props$ariaValu4, _this$props$accessibi10, _this$props$ariaLive, _this$props$ariaLabe, _this$props$ariaModa, _this$props$ariaHidd;
      var element = React.Children.only(this.props.children);
      var children = [element.props.children];
      if (__DEV__) {
        if (element.type === _View.default) {
          children.push((0, _jsxRuntime.jsx)(_PressabilityDebug.PressabilityDebugView, {
            color: "brown",
            hitSlop: this.props.hitSlop
          }));
        }
      }
      var _this$state$pressabil = this.state.pressability.getEventHandlers(),
        onBlur = _this$state$pressabil.onBlur,
        onFocus = _this$state$pressabil.onFocus,
        eventHandlersWithoutBlurAndFocus = (0, _objectWithoutProperties2.default)(_this$state$pressabil, _excluded);
      var _accessibilityState = {
        busy: (_this$props$ariaBusy = this.props['aria-busy']) != null ? _this$props$ariaBusy : (_this$props$accessibi2 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi2.busy,
        checked: (_this$props$ariaChec = this.props['aria-checked']) != null ? _this$props$ariaChec : (_this$props$accessibi3 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi3.checked,
        disabled: (_this$props$ariaDisa2 = this.props['aria-disabled']) != null ? _this$props$ariaDisa2 : (_this$props$accessibi4 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi4.disabled,
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
      return React.cloneElement.apply(React, [element, Object.assign({}, eventHandlersWithoutBlurAndFocus, getBackgroundProp(this.props.background === undefined ? TouchableNativeFeedback.SelectableBackground() : this.props.background, this.props.useForeground === true), {
        accessible: this.props.accessible !== false,
        accessibilityHint: this.props.accessibilityHint,
        accessibilityLanguage: this.props.accessibilityLanguage,
        accessibilityLabel: accessibilityLabel,
        accessibilityRole: this.props.accessibilityRole,
        accessibilityState: _accessibilityState,
        accessibilityActions: this.props.accessibilityActions,
        onAccessibilityAction: this.props.onAccessibilityAction,
        accessibilityValue: accessibilityValue,
        importantForAccessibility: this.props['aria-hidden'] === true ? 'no-hide-descendants' : this.props.importantForAccessibility,
        accessibilityViewIsModal: (_this$props$ariaModa = this.props['aria-modal']) != null ? _this$props$ariaModa : this.props.accessibilityViewIsModal,
        accessibilityLiveRegion: accessibilityLiveRegion,
        accessibilityElementsHidden: (_this$props$ariaHidd = this.props['aria-hidden']) != null ? _this$props$ariaHidd : this.props.accessibilityElementsHidden,
        hasTVPreferredFocus: this.props.hasTVPreferredFocus,
        hitSlop: this.props.hitSlop,
        focusable: this.props.focusable !== false && this.props.onPress !== undefined && !this.props.disabled,
        nativeID: this.props.nativeID,
        nextFocusDown: this.props.nextFocusDown,
        nextFocusForward: this.props.nextFocusForward,
        nextFocusLeft: this.props.nextFocusLeft,
        nextFocusRight: this.props.nextFocusRight,
        nextFocusUp: this.props.nextFocusUp,
        onLayout: this.props.onLayout,
        testID: this.props.testID
      })].concat(children));
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState) {
      this.state.pressability.configure(this._createPressabilityConfig());
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.state.pressability.reset();
    }
  }]);
  return TouchableNativeFeedback;
}(React.Component);
TouchableNativeFeedback.SelectableBackground = function (rippleRadius) {
  return {
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackground',
    rippleRadius: rippleRadius
  };
};
TouchableNativeFeedback.SelectableBackgroundBorderless = function (rippleRadius) {
  return {
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackgroundBorderless',
    rippleRadius: rippleRadius
  };
};
TouchableNativeFeedback.Ripple = function (color, borderless, rippleRadius) {
  var processedColor = (0, _processColor.default)(color);
  (0, _invariant.default)(processedColor == null || typeof processedColor === 'number', 'Unexpected color given for Ripple color');
  return {
    type: 'RippleAndroid',
    color: processedColor,
    borderless: borderless,
    rippleRadius: rippleRadius
  };
};
TouchableNativeFeedback.canUseNativeForeground = function () {
  return _Platform.default.OS === 'android' && _Platform.default.Version >= 23;
};
var getBackgroundProp = _Platform.default.OS === 'android' ? function (background, useForeground) {
  return useForeground && TouchableNativeFeedback.canUseNativeForeground() ? {
    nativeForegroundAndroid: background
  } : {
    nativeBackgroundAndroid: background
  };
} : function (background, useForeground) {
  return null;
};
TouchableNativeFeedback.displayName = 'TouchableNativeFeedback';
module.exports = TouchableNativeFeedback;
//# sourceMappingURL=TouchableNativeFeedback.js.map