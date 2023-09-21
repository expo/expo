var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useIsFocused;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var React = _interopRequireWildcard(require("react"));
var _useNavigation = _interopRequireDefault(require("./useNavigation"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useIsFocused() {
  var navigation = (0, _useNavigation.default)();
  var _useState = (0, React.useState)(navigation.isFocused),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    isFocused = _useState2[0],
    setIsFocused = _useState2[1];
  var valueToReturn = navigation.isFocused();
  if (isFocused !== valueToReturn) {
    setIsFocused(valueToReturn);
  }
  React.useEffect(function () {
    var unsubscribeFocus = navigation.addListener('focus', function () {
      return setIsFocused(true);
    });
    var unsubscribeBlur = navigation.addListener('blur', function () {
      return setIsFocused(false);
    });
    return function () {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);
  React.useDebugValue(valueToReturn);
  return valueToReturn;
}