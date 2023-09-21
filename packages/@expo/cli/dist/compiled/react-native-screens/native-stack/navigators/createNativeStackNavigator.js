var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _native = require("@react-navigation/native");
var React = _interopRequireWildcard(require("react"));
var _NativeStackView = _interopRequireDefault(require("../views/NativeStackView"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["initialRouteName", "children", "screenOptions"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function NativeStackNavigator(_ref) {
  var initialRouteName = _ref.initialRouteName,
    children = _ref.children,
    screenOptions = _ref.screenOptions,
    rest = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var _useNavigationBuilder = (0, _native.useNavigationBuilder)(_native.StackRouter, {
      initialRouteName: initialRouteName,
      children: children,
      screenOptions: screenOptions
    }),
    state = _useNavigationBuilder.state,
    descriptors = _useNavigationBuilder.descriptors,
    navigation = _useNavigationBuilder.navigation;
  React.useEffect(function () {
    if ((navigation == null ? void 0 : navigation.dangerouslyGetParent) === undefined) {
      console.warn('Looks like you are importing `native-stack` from `react-native-screens/native-stack`. Since version 6 of `react-navigation`, it should be imported from `@react-navigation/native-stack`.');
    }
  }, [navigation]);
  React.useEffect(function () {
    return navigation == null ? void 0 : navigation.addListener == null ? void 0 : navigation.addListener('tabPress', function (e) {
      var isFocused = navigation.isFocused();
      requestAnimationFrame(function () {
        if (state.index > 0 && isFocused && !e.defaultPrevented) {
          navigation.dispatch(Object.assign({}, _native.StackActions.popToTop(), {
            target: state.key
          }));
        }
      });
    });
  }, [navigation, state.index, state.key]);
  return (0, _jsxRuntime.jsx)(_NativeStackView.default, Object.assign({}, rest, {
    state: state,
    navigation: navigation,
    descriptors: descriptors
  }));
}
var _default = (0, _native.createNavigatorFactory)(NativeStackNavigator);
exports.default = _default;