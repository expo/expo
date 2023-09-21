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
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["onBlur", "onFocus"],
  _excluded2 = ["aria-disabled"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var PASSTHROUGH_PROPS = ['accessibilityActions', 'accessibilityElementsHidden', 'accessibilityHint', 'accessibilityLanguage', 'accessibilityIgnoresInvertColors', 'accessibilityLabel', 'accessibilityLiveRegion', 'accessibilityRole', 'accessibilityValue', 'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext', 'accessibilityViewIsModal', 'aria-modal', 'hitSlop', 'importantForAccessibility', 'nativeID', 'onAccessibilityAction', 'onBlur', 'onFocus', 'onLayout', 'testID'];
var TouchableWithoutFeedback = function (_React$Component) {
  (0, _inherits2.default)(TouchableWithoutFeedback, _React$Component);
  var _super = _createSuper(TouchableWithoutFeedback);
  function TouchableWithoutFeedback() {
    var _this;
    (0, _classCallCheck2.default)(this, TouchableWithoutFeedback);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.state = {
      pressability: new _Pressability.default(createPressabilityConfig(_this.props))
    };
    return _this;
  }
  (0, _createClass2.default)(TouchableWithoutFeedback, [{
    key: "render",
    value: function render() {
      var _this$props$ariaBusy, _this$props$accessibi, _this$props$ariaChec, _this$props$accessibi2, _this$props$ariaDisa, _this$props$accessibi3, _this$props$ariaExpa, _this$props$accessibi4, _this$props$ariaSele, _this$props$accessibi5, _this$props$ariaHidd, _this$props$id;
      var element = React.Children.only(this.props.children);
      var children = [element.props.children];
      var ariaLive = this.props['aria-live'];
      if (__DEV__) {
        if (element.type === _View.default) {
          children.push((0, _jsxRuntime.jsx)(_PressabilityDebug.PressabilityDebugView, {
            color: "red",
            hitSlop: this.props.hitSlop
          }));
        }
      }
      var _accessibilityState = {
        busy: (_this$props$ariaBusy = this.props['aria-busy']) != null ? _this$props$ariaBusy : (_this$props$accessibi = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi.busy,
        checked: (_this$props$ariaChec = this.props['aria-checked']) != null ? _this$props$ariaChec : (_this$props$accessibi2 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi2.checked,
        disabled: (_this$props$ariaDisa = this.props['aria-disabled']) != null ? _this$props$ariaDisa : (_this$props$accessibi3 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi3.disabled,
        expanded: (_this$props$ariaExpa = this.props['aria-expanded']) != null ? _this$props$ariaExpa : (_this$props$accessibi4 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi4.expanded,
        selected: (_this$props$ariaSele = this.props['aria-selected']) != null ? _this$props$ariaSele : (_this$props$accessibi5 = this.props.accessibilityState) == null ? void 0 : _this$props$accessibi5.selected
      };
      var _this$state$pressabil = this.state.pressability.getEventHandlers(),
        onBlur = _this$state$pressabil.onBlur,
        onFocus = _this$state$pressabil.onFocus,
        eventHandlersWithoutBlurAndFocus = (0, _objectWithoutProperties2.default)(_this$state$pressabil, _excluded);
      var elementProps = Object.assign({}, eventHandlersWithoutBlurAndFocus, {
        accessible: this.props.accessible !== false,
        accessibilityState: this.props.disabled != null ? Object.assign({}, _accessibilityState, {
          disabled: this.props.disabled
        }) : _accessibilityState,
        focusable: this.props.focusable !== false && this.props.onPress !== undefined,
        accessibilityElementsHidden: (_this$props$ariaHidd = this.props['aria-hidden']) != null ? _this$props$ariaHidd : this.props.accessibilityElementsHidden,
        importantForAccessibility: this.props['aria-hidden'] === true ? 'no-hide-descendants' : this.props.importantForAccessibility,
        accessibilityLiveRegion: ariaLive === 'off' ? 'none' : ariaLive != null ? ariaLive : this.props.accessibilityLiveRegion,
        nativeID: (_this$props$id = this.props.id) != null ? _this$props$id : this.props.nativeID
      });
      for (var prop of PASSTHROUGH_PROPS) {
        if (this.props[prop] !== undefined) {
          elementProps[prop] = this.props[prop];
        }
      }
      return React.cloneElement.apply(React, [element, elementProps].concat(children));
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      this.state.pressability.configure(createPressabilityConfig(this.props));
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.state.pressability.reset();
    }
  }]);
  return TouchableWithoutFeedback;
}(React.Component);
function createPressabilityConfig(_ref) {
  var _props$accessibilityS;
  var ariaDisabled = _ref['aria-disabled'],
    props = (0, _objectWithoutProperties2.default)(_ref, _excluded2);
  var accessibilityStateDisabled = ariaDisabled != null ? ariaDisabled : (_props$accessibilityS = props.accessibilityState) == null ? void 0 : _props$accessibilityS.disabled;
  return {
    cancelable: !props.rejectResponderTermination,
    disabled: props.disabled !== null ? props.disabled : accessibilityStateDisabled,
    hitSlop: props.hitSlop,
    delayLongPress: props.delayLongPress,
    delayPressIn: props.delayPressIn,
    delayPressOut: props.delayPressOut,
    minPressDuration: 0,
    pressRectOffset: props.pressRetentionOffset,
    android_disableSound: props.touchSoundDisabled,
    onBlur: props.onBlur,
    onFocus: props.onFocus,
    onLongPress: props.onLongPress,
    onPress: props.onPress,
    onPressIn: props.onPressIn,
    onPressOut: props.onPressOut
  };
}
TouchableWithoutFeedback.displayName = 'TouchableWithoutFeedback';
module.exports = TouchableWithoutFeedback;