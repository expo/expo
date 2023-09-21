var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _flattenStyle = _interopRequireDefault(require("../../StyleSheet/flattenStyle"));
var _TextAncestor = _interopRequireDefault(require("../../Text/TextAncestor"));
var _AcessibilityMapping = require("../../Utilities/AcessibilityMapping");
var _ViewNativeComponent = _interopRequireDefault(require("./ViewNativeComponent"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["accessibilityElementsHidden", "accessibilityLabel", "accessibilityLabelledBy", "accessibilityLiveRegion", "accessibilityRole", "accessibilityState", "accessibilityValue", "aria-busy", "aria-checked", "aria-disabled", "aria-expanded", "aria-hidden", "aria-label", "aria-labelledby", "aria-live", "aria-selected", "aria-valuemax", "aria-valuemin", "aria-valuenow", "aria-valuetext", "focusable", "id", "importantForAccessibility", "nativeID", "pointerEvents", "role", "tabIndex"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var View = React.forwardRef(function (_ref, forwardedRef) {
  var _ariaLabelledBy$split;
  var accessibilityElementsHidden = _ref.accessibilityElementsHidden,
    accessibilityLabel = _ref.accessibilityLabel,
    accessibilityLabelledBy = _ref.accessibilityLabelledBy,
    accessibilityLiveRegion = _ref.accessibilityLiveRegion,
    accessibilityRole = _ref.accessibilityRole,
    accessibilityState = _ref.accessibilityState,
    accessibilityValue = _ref.accessibilityValue,
    ariaBusy = _ref['aria-busy'],
    ariaChecked = _ref['aria-checked'],
    ariaDisabled = _ref['aria-disabled'],
    ariaExpanded = _ref['aria-expanded'],
    ariaHidden = _ref['aria-hidden'],
    ariaLabel = _ref['aria-label'],
    ariaLabelledBy = _ref['aria-labelledby'],
    ariaLive = _ref['aria-live'],
    ariaSelected = _ref['aria-selected'],
    ariaValueMax = _ref['aria-valuemax'],
    ariaValueMin = _ref['aria-valuemin'],
    ariaValueNow = _ref['aria-valuenow'],
    ariaValueText = _ref['aria-valuetext'],
    focusable = _ref.focusable,
    id = _ref.id,
    importantForAccessibility = _ref.importantForAccessibility,
    nativeID = _ref.nativeID,
    pointerEvents = _ref.pointerEvents,
    role = _ref.role,
    tabIndex = _ref.tabIndex,
    otherProps = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var _accessibilityLabelledBy = (_ariaLabelledBy$split = ariaLabelledBy == null ? void 0 : ariaLabelledBy.split(/\s*,\s*/g)) != null ? _ariaLabelledBy$split : accessibilityLabelledBy;
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
  var _accessibilityValue;
  if (accessibilityValue != null || ariaValueMax != null || ariaValueMin != null || ariaValueNow != null || ariaValueText != null) {
    _accessibilityValue = {
      max: ariaValueMax != null ? ariaValueMax : accessibilityValue == null ? void 0 : accessibilityValue.max,
      min: ariaValueMin != null ? ariaValueMin : accessibilityValue == null ? void 0 : accessibilityValue.min,
      now: ariaValueNow != null ? ariaValueNow : accessibilityValue == null ? void 0 : accessibilityValue.now,
      text: ariaValueText != null ? ariaValueText : accessibilityValue == null ? void 0 : accessibilityValue.text
    };
  }
  var style = (0, _flattenStyle.default)(otherProps.style);
  var newPointerEvents = (style == null ? void 0 : style.pointerEvents) || pointerEvents;
  return (0, _jsxRuntime.jsx)(_TextAncestor.default.Provider, {
    value: false,
    children: (0, _jsxRuntime.jsx)(_ViewNativeComponent.default, Object.assign({}, otherProps, {
      accessibilityLiveRegion: ariaLive === 'off' ? 'none' : ariaLive != null ? ariaLive : accessibilityLiveRegion,
      accessibilityLabel: ariaLabel != null ? ariaLabel : accessibilityLabel,
      focusable: tabIndex !== undefined ? !tabIndex : focusable,
      accessibilityState: _accessibilityState,
      accessibilityRole: role ? (0, _AcessibilityMapping.getAccessibilityRoleFromRole)(role) : accessibilityRole,
      accessibilityElementsHidden: ariaHidden != null ? ariaHidden : accessibilityElementsHidden,
      accessibilityLabelledBy: _accessibilityLabelledBy,
      accessibilityValue: _accessibilityValue,
      importantForAccessibility: ariaHidden === true ? 'no-hide-descendants' : importantForAccessibility,
      nativeID: id != null ? id : nativeID,
      style: style,
      pointerEvents: newPointerEvents,
      ref: forwardedRef
    }))
  });
});
View.displayName = 'View';
module.exports = View;