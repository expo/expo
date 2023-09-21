var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useBackPressSubscription = useBackPressSubscription;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
function useBackPressSubscription(_ref) {
  var onBackPress = _ref.onBackPress,
    isDisabled = _ref.isDisabled;
  var _React$useState = _react.default.useState(false),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    isActive = _React$useState2[0],
    setIsActive = _React$useState2[1];
  var subscription = _react.default.useRef();
  var clearSubscription = _react.default.useCallback(function () {
    var _subscription$current;
    var shouldSetActive = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    (_subscription$current = subscription.current) == null ? void 0 : _subscription$current.remove();
    subscription.current = undefined;
    if (shouldSetActive) setIsActive(false);
  }, []);
  var createSubscription = _react.default.useCallback(function () {
    if (!isDisabled) {
      var _subscription$current2;
      (_subscription$current2 = subscription.current) == null ? void 0 : _subscription$current2.remove();
      subscription.current = _reactNative.BackHandler.addEventListener('hardwareBackPress', onBackPress);
      setIsActive(true);
    }
  }, [isDisabled, onBackPress]);
  var handleAttached = _react.default.useCallback(function () {
    if (isActive) {
      createSubscription();
    }
  }, [createSubscription, isActive]);
  var handleDetached = _react.default.useCallback(function () {
    clearSubscription(false);
  }, [clearSubscription]);
  _react.default.useEffect(function () {
    if (isDisabled) {
      clearSubscription();
    }
  }, [isDisabled, clearSubscription]);
  return {
    handleAttached: handleAttached,
    handleDetached: handleDetached,
    createSubscription: createSubscription,
    clearSubscription: clearSubscription
  };
}