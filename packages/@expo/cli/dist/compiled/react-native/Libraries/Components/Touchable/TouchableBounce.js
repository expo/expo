var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _Animated = _interopRequireDefault(require("../../Animated/Animated"));
var _Pressability = _interopRequireDefault(require("../../Pressability/Pressability"));
var _PressabilityDebug = require("../../Pressability/PressabilityDebug");
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["onBlur", "onFocus"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var TouchableBounce = function (_React$Component) {
  (0, _inherits2.default)(TouchableBounce, _React$Component);
  var _super = _createSuper(TouchableBounce);
  function TouchableBounce() {
    var _this;
    (0, _classCallCheck2.default)(this, TouchableBounce);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.state = {
      pressability: new _Pressability.default(_this._createPressabilityConfig()),
      scale: new _Animated.default.Value(1)
    };
    return _this;
  }
  (0, _createClass2.default)(TouchableBounce, [{
    key: "_createPressabilityConfig",
    value: function _createPressabilityConfig() {
      var _this2 = this;
      return {
        cancelable: !this.props.rejectResponderTermination,
        disabled: this.props.disabled,
        hitSlop: this.props.hitSlop,
        delayLongPress: this.props.delayLongPress,
        delayPressIn: this.props.delayPressIn,
        delayPressOut: this.props.delayPressOut,
        minPressDuration: 0,
        pressRectOffset: this.props.pressRetentionOffset,
        android_disableSound: this.props.touchSoundDisabled,
        onBlur: function onBlur(event) {
          if (_Platform.default.isTV) {
            _this2._bounceTo(1, 0.4, 0);
          }
          if (_this2.props.onBlur != null) {
            _this2.props.onBlur(event);
          }
        },
        onFocus: function onFocus(event) {
          if (_Platform.default.isTV) {
            _this2._bounceTo(0.93, 0.1, 0);
          }
          if (_this2.props.onFocus != null) {
            _this2.props.onFocus(event);
          }
        },
        onLongPress: this.props.onLongPress,
        onPress: function onPress(event) {
          var _this2$props$releaseB, _this2$props$releaseV;
          var _this2$props = _this2.props,
            onPressAnimationComplete = _this2$props.onPressAnimationComplete,
            onPressWithCompletion = _this2$props.onPressWithCompletion;
          var releaseBounciness = (_this2$props$releaseB = _this2.props.releaseBounciness) != null ? _this2$props$releaseB : 10;
          var releaseVelocity = (_this2$props$releaseV = _this2.props.releaseVelocity) != null ? _this2$props$releaseV : 10;
          if (onPressWithCompletion != null) {
            onPressWithCompletion(function () {
              _this2.state.scale.setValue(0.93);
              _this2._bounceTo(1, releaseVelocity, releaseBounciness, onPressAnimationComplete);
            });
            return;
          }
          _this2._bounceTo(1, releaseVelocity, releaseBounciness, onPressAnimationComplete);
          if (_this2.props.onPress != null) {
            _this2.props.onPress(event);
          }
        },
        onPressIn: function onPressIn(event) {
          _this2._bounceTo(0.93, 0.1, 0);
          if (_this2.props.onPressIn != null) {
            _this2.props.onPressIn(event);
          }
        },
        onPressOut: function onPressOut(event) {
          _this2._bounceTo(1, 0.4, 0);
          if (_this2.props.onPressOut != null) {
            _this2.props.onPressOut(event);
          }
        }
      };
    }
  }, {
    key: "_bounceTo",
    value: function _bounceTo(toValue, velocity, bounciness, callback) {
      _Animated.default.spring(this.state.scale, {
        toValue: toValue,
        velocity: velocity,
        bounciness: bounciness,
        useNativeDriver: true
      }).start(callback);
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props$ariaLive, _this$props$ariaBusy, _this$props$accessibi, _this$props$ariaChec, _this$props$accessibi2, _this$props$ariaDisa, _this$props$accessibi3, _this$props$ariaExpa, _this$props$accessibi4, _this$props$ariaSele, _this$props$accessibi5, _this$props$ariaValu, _this$props$accessibi6, _this$props$ariaValu2, _this$props$accessibi7, _this$props$ariaValu3, _this$props$accessibi8, _this$props$ariaValu4, _this$props$accessibi9, _this$props$ariaLabe, _this$props$ariaModa, _this$props$ariaHidd;
      var _this$state$pressabil = this.state.pressability.getEventHandlers(),
        onBlur = _this$state$pressabil.onBlur,
        onFocus = _this$state$pressabil.onFocus,
        eventHandlersWithoutBlurAndFocus = (0, _objectWithoutProperties2.default)(_this$state$pressabil, _excluded);
      var accessibilityLiveRegion = this.props['aria-live'] === 'off' ? 'none' : (_this$props$ariaLive = this.props['aria-live']) != null ? _this$props$ariaLive : this.props.accessibilityLiveRegion;
      var _accessibilityState = {
        busy: (_this$props$ariaBusy = this.props['aria-busy']) != null ? _this$props$ariaBusy : (_this$props$accessibi = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi.busy,
        checked: (_this$props$ariaChec = this.props['aria-checked']) != null ? _this$props$ariaChec : (_this$props$accessibi2 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi2.checked,
        disabled: (_this$props$ariaDisa = this.props['aria-disabled']) != null ? _this$props$ariaDisa : (_this$props$accessibi3 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi3.disabled,
        expanded: (_this$props$ariaExpa = this.props['aria-expanded']) != null ? _this$props$ariaExpa : (_this$props$accessibi4 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi4.expanded,
        selected: (_this$props$ariaSele = this.props['aria-selected']) != null ? _this$props$ariaSele : (_this$props$accessibi5 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi5.selected
      };
      var accessibilityValue = {
        max: (_this$props$ariaValu = this.props['aria-valuemax']) != null ? _this$props$ariaValu : (_this$props$accessibi6 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi6.max,
        min: (_this$props$ariaValu2 = this.props['aria-valuemin']) != null ? _this$props$ariaValu2 : (_this$props$accessibi7 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi7.min,
        now: (_this$props$ariaValu3 = this.props['aria-valuenow']) != null ? _this$props$ariaValu3 : (_this$props$accessibi8 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi8.now,
        text: (_this$props$ariaValu4 = this.props['aria-valuetext']) != null ? _this$props$ariaValu4 : (_this$props$accessibi9 = this.props.accessibilityValue) == null ? void 0 : _this$props$accessibi9.text
      };
      var accessibilityLabel = (_this$props$ariaLabe = this.props['aria-label']) != null ? _this$props$ariaLabe : this.props.accessibilityLabel;
      return (0, _jsxRuntime.jsxs)(_Animated.default.View, Object.assign({
        style: [{
          transform: [{
            scale: this.state.scale
          }]
        }, this.props.style],
        accessible: this.props.accessible !== false,
        accessibilityLabel: accessibilityLabel,
        accessibilityHint: this.props.accessibilityHint,
        accessibilityLanguage: this.props.accessibilityLanguage,
        accessibilityRole: this.props.accessibilityRole,
        accessibilityState: _accessibilityState,
        accessibilityActions: this.props.accessibilityActions,
        onAccessibilityAction: this.props.onAccessibilityAction,
        accessibilityValue: accessibilityValue,
        accessibilityLiveRegion: accessibilityLiveRegion,
        importantForAccessibility: this.props['aria-hidden'] === true ? 'no-hide-descendants' : this.props.importantForAccessibility,
        accessibilityViewIsModal: (_this$props$ariaModa = this.props['aria-modal']) != null ? _this$props$ariaModa : this.props.accessibilityViewIsModal,
        accessibilityElementsHidden: (_this$props$ariaHidd = this.props['aria-hidden']) != null ? _this$props$ariaHidd : this.props.accessibilityElementsHidden,
        nativeID: this.props.nativeID,
        testID: this.props.testID,
        hitSlop: this.props.hitSlop,
        focusable: this.props.focusable !== false && this.props.onPress !== undefined && !this.props.disabled,
        ref: this.props.hostRef
      }, eventHandlersWithoutBlurAndFocus, {
        children: [this.props.children, __DEV__ ? (0, _jsxRuntime.jsx)(_PressabilityDebug.PressabilityDebugView, {
          color: "orange",
          hitSlop: this.props.hitSlop
        }) : null]
      }));
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
  return TouchableBounce;
}(React.Component);
module.exports = React.forwardRef(function (props, hostRef) {
  return (0, _jsxRuntime.jsx)(TouchableBounce, Object.assign({}, props, {
    hostRef: hostRef
  }));
});