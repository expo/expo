var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _PressabilityDebug = require("../../Pressability/PressabilityDebug");
var _usePressability = _interopRequireDefault(require("../../Pressability/usePressability"));
var _View = _interopRequireDefault(require("../View/View"));
var _useAndroidRippleForView = _interopRequireDefault(require("./useAndroidRippleForView"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["accessible", "accessibilityState", "aria-live", "android_disableSound", "android_ripple", "aria-busy", "aria-checked", "aria-disabled", "aria-expanded", "aria-label", "aria-selected", "cancelable", "children", "delayHoverIn", "delayHoverOut", "delayLongPress", "disabled", "focusable", "hitSlop", "onHoverIn", "onHoverOut", "onLongPress", "onPress", "onPressIn", "onPressOut", "pressRetentionOffset", "style", "testOnly_pressed", "unstable_pressDelay"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function Pressable(props, forwardedRef) {
  var _props$ariaValuemax, _props$accessibilityV, _props$ariaValuemin, _props$accessibilityV2, _props$ariaValuenow, _props$accessibilityV3, _props$ariaValuetext, _props$accessibilityV4, _restProps$ariaModal;
  var accessible = props.accessible,
    accessibilityState = props.accessibilityState,
    ariaLive = props['aria-live'],
    android_disableSound = props.android_disableSound,
    android_ripple = props.android_ripple,
    ariaBusy = props['aria-busy'],
    ariaChecked = props['aria-checked'],
    ariaDisabled = props['aria-disabled'],
    ariaExpanded = props['aria-expanded'],
    ariaLabel = props['aria-label'],
    ariaSelected = props['aria-selected'],
    cancelable = props.cancelable,
    children = props.children,
    delayHoverIn = props.delayHoverIn,
    delayHoverOut = props.delayHoverOut,
    delayLongPress = props.delayLongPress,
    disabled = props.disabled,
    focusable = props.focusable,
    hitSlop = props.hitSlop,
    onHoverIn = props.onHoverIn,
    onHoverOut = props.onHoverOut,
    onLongPress = props.onLongPress,
    onPress = props.onPress,
    _onPressIn = props.onPressIn,
    _onPressOut = props.onPressOut,
    pressRetentionOffset = props.pressRetentionOffset,
    style = props.style,
    testOnly_pressed = props.testOnly_pressed,
    unstable_pressDelay = props.unstable_pressDelay,
    restProps = (0, _objectWithoutProperties2.default)(props, _excluded);
  var viewRef = (0, React.useRef)(null);
  (0, React.useImperativeHandle)(forwardedRef, function () {
    return viewRef.current;
  });
  var android_rippleConfig = (0, _useAndroidRippleForView.default)(android_ripple, viewRef);
  var _usePressState = usePressState(testOnly_pressed === true),
    _usePressState2 = (0, _slicedToArray2.default)(_usePressState, 2),
    pressed = _usePressState2[0],
    setPressed = _usePressState2[1];
  var _accessibilityState = {
    busy: ariaBusy != null ? ariaBusy : accessibilityState == null ? void 0 : accessibilityState.busy,
    checked: ariaChecked != null ? ariaChecked : accessibilityState == null ? void 0 : accessibilityState.checked,
    disabled: ariaDisabled != null ? ariaDisabled : accessibilityState == null ? void 0 : accessibilityState.disabled,
    expanded: ariaExpanded != null ? ariaExpanded : accessibilityState == null ? void 0 : accessibilityState.expanded,
    selected: ariaSelected != null ? ariaSelected : accessibilityState == null ? void 0 : accessibilityState.selected
  };
  _accessibilityState = disabled != null ? Object.assign({}, _accessibilityState, {
    disabled: disabled
  }) : _accessibilityState;
  var accessibilityValue = {
    max: (_props$ariaValuemax = props['aria-valuemax']) != null ? _props$ariaValuemax : (_props$accessibilityV = props.accessibilityValue) == null ? void 0 : _props$accessibilityV.max,
    min: (_props$ariaValuemin = props['aria-valuemin']) != null ? _props$ariaValuemin : (_props$accessibilityV2 = props.accessibilityValue) == null ? void 0 : _props$accessibilityV2.min,
    now: (_props$ariaValuenow = props['aria-valuenow']) != null ? _props$ariaValuenow : (_props$accessibilityV3 = props.accessibilityValue) == null ? void 0 : _props$accessibilityV3.now,
    text: (_props$ariaValuetext = props['aria-valuetext']) != null ? _props$ariaValuetext : (_props$accessibilityV4 = props.accessibilityValue) == null ? void 0 : _props$accessibilityV4.text
  };
  var accessibilityLiveRegion = ariaLive === 'off' ? 'none' : ariaLive != null ? ariaLive : props.accessibilityLiveRegion;
  var accessibilityLabel = ariaLabel != null ? ariaLabel : props.accessibilityLabel;
  var restPropsWithDefaults = Object.assign({}, restProps, android_rippleConfig == null ? void 0 : android_rippleConfig.viewProps, {
    accessible: accessible !== false,
    accessibilityViewIsModal: (_restProps$ariaModal = restProps['aria-modal']) != null ? _restProps$ariaModal : restProps.accessibilityViewIsModal,
    accessibilityLiveRegion: accessibilityLiveRegion,
    accessibilityLabel: accessibilityLabel,
    accessibilityState: _accessibilityState,
    focusable: focusable !== false,
    accessibilityValue: accessibilityValue,
    hitSlop: hitSlop
  });
  var config = (0, React.useMemo)(function () {
    return {
      cancelable: cancelable,
      disabled: disabled,
      hitSlop: hitSlop,
      pressRectOffset: pressRetentionOffset,
      android_disableSound: android_disableSound,
      delayHoverIn: delayHoverIn,
      delayHoverOut: delayHoverOut,
      delayLongPress: delayLongPress,
      delayPressIn: unstable_pressDelay,
      onHoverIn: onHoverIn,
      onHoverOut: onHoverOut,
      onLongPress: onLongPress,
      onPress: onPress,
      onPressIn: function onPressIn(event) {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressIn(event);
        }
        setPressed(true);
        if (_onPressIn != null) {
          _onPressIn(event);
        }
      },
      onPressMove: android_rippleConfig == null ? void 0 : android_rippleConfig.onPressMove,
      onPressOut: function onPressOut(event) {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressOut(event);
        }
        setPressed(false);
        if (_onPressOut != null) {
          _onPressOut(event);
        }
      }
    };
  }, [android_disableSound, android_rippleConfig, cancelable, delayHoverIn, delayHoverOut, delayLongPress, disabled, hitSlop, onHoverIn, onHoverOut, onLongPress, onPress, _onPressIn, _onPressOut, pressRetentionOffset, setPressed, unstable_pressDelay]);
  var eventHandlers = (0, _usePressability.default)(config);
  return (0, _jsxRuntime.jsxs)(_View.default, Object.assign({}, restPropsWithDefaults, eventHandlers, {
    ref: viewRef,
    style: typeof style === 'function' ? style({
      pressed: pressed
    }) : style,
    collapsable: false,
    children: [typeof children === 'function' ? children({
      pressed: pressed
    }) : children, __DEV__ ? (0, _jsxRuntime.jsx)(_PressabilityDebug.PressabilityDebugView, {
      color: "red",
      hitSlop: hitSlop
    }) : null]
  }));
}
function usePressState(forcePressed) {
  var _useState = (0, React.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    pressed = _useState2[0],
    setPressed = _useState2[1];
  return [pressed || forcePressed, setPressed];
}
var MemoedPressable = React.memo(React.forwardRef(Pressable));
MemoedPressable.displayName = 'Pressable';
var _default = MemoedPressable;
exports.default = _default;
//# sourceMappingURL=Pressable.js.map