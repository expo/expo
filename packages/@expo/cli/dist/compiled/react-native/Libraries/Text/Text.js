var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var PressabilityDebug = _interopRequireWildcard(require("../Pressability/PressabilityDebug"));
var _usePressability = _interopRequireDefault(require("../Pressability/usePressability"));
var _flattenStyle = _interopRequireDefault(require("../StyleSheet/flattenStyle"));
var _processColor = _interopRequireDefault(require("../StyleSheet/processColor"));
var _AcessibilityMapping = require("../Utilities/AcessibilityMapping");
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _TextAncestor = _interopRequireDefault(require("./TextAncestor"));
var _TextNativeComponent = require("./TextNativeComponent");
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["accessible", "accessibilityLabel", "accessibilityRole", "accessibilityState", "allowFontScaling", "aria-busy", "aria-checked", "aria-disabled", "aria-expanded", "aria-label", "aria-selected", "ellipsizeMode", "id", "nativeID", "onLongPress", "onPress", "onPressIn", "onPressOut", "onResponderGrant", "onResponderMove", "onResponderRelease", "onResponderTerminate", "onResponderTerminationRequest", "onStartShouldSetResponder", "pressRetentionOffset", "role", "suppressHighlighting"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var Text = React.forwardRef(function (props, forwardedRef) {
  var _accessibilityState2, _accessibilityState3, _style, _style3, _style4;
  var accessible = props.accessible,
    accessibilityLabel = props.accessibilityLabel,
    accessibilityRole = props.accessibilityRole,
    accessibilityState = props.accessibilityState,
    allowFontScaling = props.allowFontScaling,
    ariaBusy = props['aria-busy'],
    ariaChecked = props['aria-checked'],
    ariaDisabled = props['aria-disabled'],
    ariaExpanded = props['aria-expanded'],
    ariaLabel = props['aria-label'],
    ariaSelected = props['aria-selected'],
    ellipsizeMode = props.ellipsizeMode,
    id = props.id,
    nativeID = props.nativeID,
    onLongPress = props.onLongPress,
    onPress = props.onPress,
    _onPressIn = props.onPressIn,
    _onPressOut = props.onPressOut,
    _onResponderGrant = props.onResponderGrant,
    _onResponderMove = props.onResponderMove,
    _onResponderRelease = props.onResponderRelease,
    _onResponderTerminate = props.onResponderTerminate,
    onResponderTerminationRequest = props.onResponderTerminationRequest,
    onStartShouldSetResponder = props.onStartShouldSetResponder,
    pressRetentionOffset = props.pressRetentionOffset,
    role = props.role,
    suppressHighlighting = props.suppressHighlighting,
    restProps = (0, _objectWithoutProperties2.default)(props, _excluded);
  var _useState = (0, React.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    isHighlighted = _useState2[0],
    setHighlighted = _useState2[1];
  var _accessibilityState;
  if (accessibilityState != null || ariaBusy != null || ariaChecked != null || ariaDisabled != null || ariaExpanded != null || ariaSelected != null) {
    _accessibilityState = {
      busy: ariaBusy != null ? ariaBusy : accessibilityState == null ? void 0 : accessibilityState.busy,
      checked: ariaChecked != null ? ariaChecked : accessibilityState == null ? void 0 : accessibilityState.checked,
      disabled: ariaDisabled != null ? ariaDisabled : accessibilityState == null ? void 0 : accessibilityState.disabled,
      expanded: ariaExpanded != null ? ariaExpanded : accessibilityState == null ? void 0 : accessibilityState.expanded,
      selected: ariaSelected != null ? ariaSelected : accessibilityState == null ? void 0 : accessibilityState.selected
    };
  }
  var _disabled = restProps.disabled != null ? restProps.disabled : (_accessibilityState2 = _accessibilityState) == null ? void 0 : _accessibilityState2.disabled;
  var nativeTextAccessibilityState = _disabled !== ((_accessibilityState3 = _accessibilityState) == null ? void 0 : _accessibilityState3.disabled) ? Object.assign({}, _accessibilityState, {
    disabled: _disabled
  }) : _accessibilityState;
  var isPressable = (onPress != null || onLongPress != null || onStartShouldSetResponder != null) && _disabled !== true;
  var initialized = useLazyInitialization(isPressable);
  var config = (0, React.useMemo)(function () {
    return initialized ? {
      disabled: !isPressable,
      pressRectOffset: pressRetentionOffset,
      onLongPress: onLongPress,
      onPress: onPress,
      onPressIn: function onPressIn(event) {
        setHighlighted(!suppressHighlighting);
        _onPressIn == null ? void 0 : _onPressIn(event);
      },
      onPressOut: function onPressOut(event) {
        setHighlighted(false);
        _onPressOut == null ? void 0 : _onPressOut(event);
      },
      onResponderTerminationRequest_DEPRECATED: onResponderTerminationRequest,
      onStartShouldSetResponder_DEPRECATED: onStartShouldSetResponder
    } : null;
  }, [initialized, isPressable, pressRetentionOffset, onLongPress, onPress, _onPressIn, _onPressOut, onResponderTerminationRequest, onStartShouldSetResponder, suppressHighlighting]);
  var eventHandlers = (0, _usePressability.default)(config);
  var eventHandlersForText = (0, React.useMemo)(function () {
    return eventHandlers == null ? null : {
      onResponderGrant: function onResponderGrant(event) {
        eventHandlers.onResponderGrant(event);
        if (_onResponderGrant != null) {
          _onResponderGrant(event);
        }
      },
      onResponderMove: function onResponderMove(event) {
        eventHandlers.onResponderMove(event);
        if (_onResponderMove != null) {
          _onResponderMove(event);
        }
      },
      onResponderRelease: function onResponderRelease(event) {
        eventHandlers.onResponderRelease(event);
        if (_onResponderRelease != null) {
          _onResponderRelease(event);
        }
      },
      onResponderTerminate: function onResponderTerminate(event) {
        eventHandlers.onResponderTerminate(event);
        if (_onResponderTerminate != null) {
          _onResponderTerminate(event);
        }
      },
      onClick: eventHandlers.onClick,
      onResponderTerminationRequest: eventHandlers.onResponderTerminationRequest,
      onStartShouldSetResponder: eventHandlers.onStartShouldSetResponder
    };
  }, [eventHandlers, _onResponderGrant, _onResponderMove, _onResponderRelease, _onResponderTerminate]);
  var selectionColor = restProps.selectionColor == null ? null : (0, _processColor.default)(restProps.selectionColor);
  var style = restProps.style;
  if (__DEV__) {
    if (PressabilityDebug.isEnabled() && onPress != null) {
      style = [restProps.style, {
        color: 'magenta'
      }];
    }
  }
  var numberOfLines = restProps.numberOfLines;
  if (numberOfLines != null && !(numberOfLines >= 0)) {
    console.error(`'numberOfLines' in <Text> must be a non-negative number, received: ${numberOfLines}. The value will be set to 0.`);
    numberOfLines = 0;
  }
  var hasTextAncestor = (0, React.useContext)(_TextAncestor.default);
  var _accessible = _Platform.default.select({
    ios: accessible !== false,
    default: accessible
  });
  style = (0, _flattenStyle.default)(style);
  if (typeof ((_style = style) == null ? void 0 : _style.fontWeight) === 'number') {
    var _style2;
    style.fontWeight = (_style2 = style) == null ? void 0 : _style2.fontWeight.toString();
  }
  var _selectable = restProps.selectable;
  if (((_style3 = style) == null ? void 0 : _style3.userSelect) != null) {
    _selectable = userSelectToSelectableMap[style.userSelect];
    delete style.userSelect;
  }
  if (((_style4 = style) == null ? void 0 : _style4.verticalAlign) != null) {
    style.textAlignVertical = verticalAlignToTextAlignVerticalMap[style.verticalAlign];
    delete style.verticalAlign;
  }
  var _hasOnPressOrOnLongPress = props.onPress != null || props.onLongPress != null;
  return hasTextAncestor ? (0, _jsxRuntime.jsx)(_TextNativeComponent.NativeVirtualText, Object.assign({}, restProps, eventHandlersForText, {
    accessibilityLabel: ariaLabel != null ? ariaLabel : accessibilityLabel,
    accessibilityRole: role ? (0, _AcessibilityMapping.getAccessibilityRoleFromRole)(role) : accessibilityRole,
    accessibilityState: _accessibilityState,
    isHighlighted: isHighlighted,
    isPressable: isPressable,
    nativeID: id != null ? id : nativeID,
    numberOfLines: numberOfLines,
    ref: forwardedRef,
    selectable: _selectable,
    selectionColor: selectionColor,
    style: style
  })) : (0, _jsxRuntime.jsx)(_TextAncestor.default.Provider, {
    value: true,
    children: (0, _jsxRuntime.jsx)(_TextNativeComponent.NativeText, Object.assign({}, restProps, eventHandlersForText, {
      accessibilityLabel: ariaLabel != null ? ariaLabel : accessibilityLabel,
      accessibilityRole: role ? (0, _AcessibilityMapping.getAccessibilityRoleFromRole)(role) : accessibilityRole,
      accessibilityState: nativeTextAccessibilityState,
      accessible: accessible == null && _Platform.default.OS === 'android' ? _hasOnPressOrOnLongPress : _accessible,
      allowFontScaling: allowFontScaling !== false,
      disabled: _disabled,
      ellipsizeMode: ellipsizeMode != null ? ellipsizeMode : 'tail',
      isHighlighted: isHighlighted,
      nativeID: id != null ? id : nativeID,
      numberOfLines: numberOfLines,
      ref: forwardedRef,
      selectable: _selectable,
      selectionColor: selectionColor,
      style: style
    }))
  });
});
Text.displayName = 'Text';
Text.propTypes = require('deprecated-react-native-prop-types').TextPropTypes;
function useLazyInitialization(newValue) {
  var _useState3 = (0, React.useState)(newValue),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    oldValue = _useState4[0],
    setValue = _useState4[1];
  if (!oldValue && newValue) {
    setValue(newValue);
  }
  return oldValue;
}
var userSelectToSelectableMap = {
  auto: true,
  text: true,
  none: false,
  contain: true,
  all: true
};
var verticalAlignToTextAlignVerticalMap = {
  auto: 'auto',
  top: 'top',
  bottom: 'bottom',
  middle: 'center'
};
module.exports = Text;
//# sourceMappingURL=Text.js.map