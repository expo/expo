'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _StyleSheet = _interopRequireDefault(require("../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../Text/Text"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _TouchableNativeFeedback = _interopRequireDefault(require("./Touchable/TouchableNativeFeedback"));
var _TouchableOpacity = _interopRequireDefault(require("./Touchable/TouchableOpacity"));
var _View = _interopRequireDefault(require("./View/View"));
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var Button = function (_React$Component) {
  (0, _inherits2.default)(Button, _React$Component);
  var _super = _createSuper(Button);
  function Button() {
    (0, _classCallCheck2.default)(this, Button);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(Button, [{
    key: "render",
    value: function render() {
      var _accessibilityState2, _accessibilityState3;
      var _this$props = this.props,
        accessibilityLabel = _this$props.accessibilityLabel,
        accessibilityState = _this$props.accessibilityState,
        ariaBusy = _this$props['aria-busy'],
        ariaChecked = _this$props['aria-checked'],
        ariaDisabled = _this$props['aria-disabled'],
        ariaExpanded = _this$props['aria-expanded'],
        ariaLabel = _this$props['aria-label'],
        ariaSelected = _this$props['aria-selected'],
        importantForAccessibility = _this$props.importantForAccessibility,
        color = _this$props.color,
        onPress = _this$props.onPress,
        touchSoundDisabled = _this$props.touchSoundDisabled,
        title = _this$props.title,
        hasTVPreferredFocus = _this$props.hasTVPreferredFocus,
        nextFocusDown = _this$props.nextFocusDown,
        nextFocusForward = _this$props.nextFocusForward,
        nextFocusLeft = _this$props.nextFocusLeft,
        nextFocusRight = _this$props.nextFocusRight,
        nextFocusUp = _this$props.nextFocusUp,
        testID = _this$props.testID,
        accessible = _this$props.accessible,
        accessibilityActions = _this$props.accessibilityActions,
        accessibilityHint = _this$props.accessibilityHint,
        accessibilityLanguage = _this$props.accessibilityLanguage,
        onAccessibilityAction = _this$props.onAccessibilityAction;
      var buttonStyles = [styles.button];
      var textStyles = [styles.text];
      if (color) {
        if (_Platform.default.OS === 'ios') {
          textStyles.push({
            color: color
          });
        } else {
          buttonStyles.push({
            backgroundColor: color
          });
        }
      }
      var _accessibilityState = {
        busy: ariaBusy != null ? ariaBusy : accessibilityState == null ? void 0 : accessibilityState.busy,
        checked: ariaChecked != null ? ariaChecked : accessibilityState == null ? void 0 : accessibilityState.checked,
        disabled: ariaDisabled != null ? ariaDisabled : accessibilityState == null ? void 0 : accessibilityState.disabled,
        expanded: ariaExpanded != null ? ariaExpanded : accessibilityState == null ? void 0 : accessibilityState.expanded,
        selected: ariaSelected != null ? ariaSelected : accessibilityState == null ? void 0 : accessibilityState.selected
      };
      var disabled = this.props.disabled != null ? this.props.disabled : (_accessibilityState2 = _accessibilityState) == null ? void 0 : _accessibilityState2.disabled;
      _accessibilityState = disabled !== ((_accessibilityState3 = _accessibilityState) == null ? void 0 : _accessibilityState3.disabled) ? Object.assign({}, _accessibilityState, {
        disabled: disabled
      }) : _accessibilityState;
      if (disabled) {
        buttonStyles.push(styles.buttonDisabled);
        textStyles.push(styles.textDisabled);
      }
      (0, _invariant.default)(typeof title === 'string', 'The title prop of a Button must be a string');
      var formattedTitle = _Platform.default.OS === 'android' ? title.toUpperCase() : title;
      var Touchable = _Platform.default.OS === 'android' ? _TouchableNativeFeedback.default : _TouchableOpacity.default;
      var _importantForAccessibility = importantForAccessibility === 'no' ? 'no-hide-descendants' : importantForAccessibility;
      return (0, _jsxRuntime.jsx)(Touchable, {
        accessible: accessible,
        accessibilityActions: accessibilityActions,
        onAccessibilityAction: onAccessibilityAction,
        accessibilityLabel: ariaLabel || accessibilityLabel,
        accessibilityHint: accessibilityHint,
        accessibilityLanguage: accessibilityLanguage,
        accessibilityRole: "button",
        accessibilityState: _accessibilityState,
        importantForAccessibility: _importantForAccessibility,
        hasTVPreferredFocus: hasTVPreferredFocus,
        nextFocusDown: nextFocusDown,
        nextFocusForward: nextFocusForward,
        nextFocusLeft: nextFocusLeft,
        nextFocusRight: nextFocusRight,
        nextFocusUp: nextFocusUp,
        testID: testID,
        disabled: disabled,
        onPress: onPress,
        touchSoundDisabled: touchSoundDisabled,
        children: (0, _jsxRuntime.jsx)(_View.default, {
          style: buttonStyles,
          children: (0, _jsxRuntime.jsx)(_Text.default, {
            style: textStyles,
            disabled: disabled,
            children: formattedTitle
          })
        })
      });
    }
  }]);
  return Button;
}(React.Component);
var styles = _StyleSheet.default.create({
  button: _Platform.default.select({
    ios: {},
    android: {
      elevation: 4,
      backgroundColor: '#2196F3',
      borderRadius: 2
    }
  }),
  text: Object.assign({
    textAlign: 'center',
    margin: 8
  }, _Platform.default.select({
    ios: {
      color: '#007AFF',
      fontSize: 18
    },
    android: {
      color: 'white',
      fontWeight: '500'
    }
  })),
  buttonDisabled: _Platform.default.select({
    ios: {},
    android: {
      elevation: 0,
      backgroundColor: '#dfdfdf'
    }
  }),
  textDisabled: _Platform.default.select({
    ios: {
      color: '#cdcdcd'
    },
    android: {
      color: '#a1a1a1'
    }
  })
});
module.exports = Button;