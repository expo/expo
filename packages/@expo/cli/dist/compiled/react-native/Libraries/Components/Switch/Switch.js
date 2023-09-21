var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _useMergeRefs = _interopRequireDefault(require("../../Utilities/useMergeRefs"));
var _AndroidSwitchNativeComponent = _interopRequireWildcard(require("./AndroidSwitchNativeComponent"));
var _SwitchNativeComponent = _interopRequireWildcard(require("./SwitchNativeComponent"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["disabled", "ios_backgroundColor", "onChange", "onValueChange", "style", "thumbColor", "trackColor", "value"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var returnsFalse = function returnsFalse() {
  return false;
};
var returnsTrue = function returnsTrue() {
  return true;
};
var SwitchWithForwardedRef = React.forwardRef(function Switch(props, forwardedRef) {
  var disabled = props.disabled,
    ios_backgroundColor = props.ios_backgroundColor,
    onChange = props.onChange,
    onValueChange = props.onValueChange,
    style = props.style,
    thumbColor = props.thumbColor,
    trackColor = props.trackColor,
    value = props.value,
    restProps = (0, _objectWithoutProperties2.default)(props, _excluded);
  var trackColorForFalse = trackColor == null ? void 0 : trackColor.false;
  var trackColorForTrue = trackColor == null ? void 0 : trackColor.true;
  var nativeSwitchRef = React.useRef(null);
  var ref = (0, _useMergeRefs.default)(nativeSwitchRef, forwardedRef);
  var _React$useState = React.useState({
      value: null
    }),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    native = _React$useState2[0],
    setNative = _React$useState2[1];
  var handleChange = function handleChange(event) {
    onChange == null ? void 0 : onChange(event);
    onValueChange == null ? void 0 : onValueChange(event.nativeEvent.value);
    setNative({
      value: event.nativeEvent.value
    });
  };
  React.useLayoutEffect(function () {
    var _nativeSwitchRef$curr;
    var jsValue = value === true;
    var shouldUpdateNativeSwitch = native.value != null && native.value !== jsValue;
    if (shouldUpdateNativeSwitch && ((_nativeSwitchRef$curr = nativeSwitchRef.current) == null ? void 0 : _nativeSwitchRef$curr.setNativeProps) != null) {
      if (_Platform.default.OS === 'android') {
        _AndroidSwitchNativeComponent.Commands.setNativeValue(nativeSwitchRef.current, jsValue);
      } else {
        _SwitchNativeComponent.Commands.setValue(nativeSwitchRef.current, jsValue);
      }
    }
  }, [value, native]);
  if (_Platform.default.OS === 'android') {
    var _props$accessibilityR;
    var accessibilityState = restProps.accessibilityState;
    var _disabled = disabled != null ? disabled : accessibilityState == null ? void 0 : accessibilityState.disabled;
    var _accessibilityState = _disabled !== (accessibilityState == null ? void 0 : accessibilityState.disabled) ? Object.assign({}, accessibilityState, {
      disabled: _disabled
    }) : accessibilityState;
    var platformProps = {
      accessibilityState: _accessibilityState,
      enabled: _disabled !== true,
      on: value === true,
      style: style,
      thumbTintColor: thumbColor,
      trackColorForFalse: trackColorForFalse,
      trackColorForTrue: trackColorForTrue,
      trackTintColor: value === true ? trackColorForTrue : trackColorForFalse
    };
    return (0, _jsxRuntime.jsx)(_AndroidSwitchNativeComponent.default, Object.assign({}, restProps, platformProps, {
      accessibilityRole: (_props$accessibilityR = props.accessibilityRole) != null ? _props$accessibilityR : 'switch',
      onChange: handleChange,
      onResponderTerminationRequest: returnsFalse,
      onStartShouldSetResponder: returnsTrue,
      ref: ref
    }));
  } else {
    var _props$accessibilityR2;
    var _platformProps = {
      disabled: disabled,
      onTintColor: trackColorForTrue,
      style: _StyleSheet.default.compose({
        height: 31,
        width: 51
      }, _StyleSheet.default.compose(style, ios_backgroundColor == null ? null : {
        backgroundColor: ios_backgroundColor,
        borderRadius: 16
      })),
      thumbTintColor: thumbColor,
      tintColor: trackColorForFalse,
      value: value === true
    };
    return (0, _jsxRuntime.jsx)(_SwitchNativeComponent.default, Object.assign({}, restProps, _platformProps, {
      accessibilityRole: (_props$accessibilityR2 = props.accessibilityRole) != null ? _props$accessibilityR2 : 'switch',
      onChange: handleChange,
      onResponderTerminationRequest: returnsFalse,
      onStartShouldSetResponder: returnsTrue,
      ref: ref
    }));
  }
});
var _default = SwitchWithForwardedRef;
exports.default = _default;