var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = NativeStackView;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _AppContainer = _interopRequireDefault(require("react-native/Libraries/ReactNative/AppContainer"));
var _warnOnce = _interopRequireDefault(require("warn-once"));
var _reactNativeScreens = require("react-native-screens");
var _native = require("@react-navigation/native");
var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
var _HeaderConfig = _interopRequireDefault(require("./HeaderConfig"));
var _SafeAreaProviderCompat = _interopRequireDefault(require("../utils/SafeAreaProviderCompat"));
var _getDefaultHeaderHeight = _interopRequireDefault(require("../utils/getDefaultHeaderHeight"));
var _HeaderHeightContext = _interopRequireDefault(require("../utils/HeaderHeightContext"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["stackPresentation"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var isAndroid = _reactNative.Platform.OS === 'android';
var Container = _reactNative.View;
if (__DEV__) {
  var DebugContainer = function DebugContainer(props) {
    var stackPresentation = props.stackPresentation,
      rest = (0, _objectWithoutProperties2.default)(props, _excluded);
    if (_reactNative.Platform.OS === 'ios' && stackPresentation !== 'push') {
      return (0, _jsxRuntime.jsx)(_AppContainer.default, {
        children: (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, rest))
      });
    }
    return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, rest));
  };
  Container = DebugContainer;
}
var MaybeNestedStack = function MaybeNestedStack(_ref) {
  var options = _ref.options,
    route = _ref.route,
    stackPresentation = _ref.stackPresentation,
    children = _ref.children;
  var _useTheme = (0, _native.useTheme)(),
    colors = _useTheme.colors;
  var _options$headerShown = options.headerShown,
    headerShown = _options$headerShown === void 0 ? true : _options$headerShown,
    contentStyle = options.contentStyle;
  var Screen = React.useContext(_reactNativeScreens.ScreenContext);
  var isHeaderInModal = isAndroid ? false : stackPresentation !== 'push' && headerShown === true;
  var headerShownPreviousRef = React.useRef(headerShown);
  React.useEffect(function () {
    (0, _warnOnce.default)(!isAndroid && stackPresentation !== 'push' && headerShownPreviousRef.current !== headerShown, `Dynamically changing 'headerShown' in modals will result in remounting the screen and losing all local state. See options for the screen '${route.name}'.`);
    headerShownPreviousRef.current = headerShown;
  }, [headerShown, stackPresentation, route.name]);
  var content = (0, _jsxRuntime.jsx)(Container, {
    style: [styles.container, stackPresentation !== 'transparentModal' && stackPresentation !== 'containedTransparentModal' && {
      backgroundColor: colors.background
    }, contentStyle],
    stackPresentation: stackPresentation,
    children: children
  });
  var topInset = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)().top;
  var dimensions = (0, _reactNativeSafeAreaContext.useSafeAreaFrame)();
  var headerHeight = (0, _getDefaultHeaderHeight.default)(dimensions, topInset, stackPresentation);
  if (isHeaderInModal) {
    return (0, _jsxRuntime.jsx)(_reactNativeScreens.ScreenStack, {
      style: styles.container,
      children: (0, _jsxRuntime.jsx)(Screen, {
        enabled: true,
        isNativeStack: true,
        style: _reactNative.StyleSheet.absoluteFill,
        children: (0, _jsxRuntime.jsxs)(_HeaderHeightContext.default.Provider, {
          value: headerHeight,
          children: [(0, _jsxRuntime.jsx)(_HeaderConfig.default, Object.assign({}, options, {
            route: route
          })), content]
        })
      })
    });
  }
  return content;
};
var RouteView = function RouteView(_ref2) {
  var descriptors = _ref2.descriptors,
    route = _ref2.route,
    index = _ref2.index,
    navigation = _ref2.navigation,
    stateKey = _ref2.stateKey;
  var _descriptors$route$ke = descriptors[route.key],
    options = _descriptors$route$ke.options,
    renderScene = _descriptors$route$ke.render;
  var gestureEnabled = options.gestureEnabled,
    headerShown = options.headerShown,
    hideKeyboardOnSwipe = options.hideKeyboardOnSwipe,
    homeIndicatorHidden = options.homeIndicatorHidden,
    _options$sheetAllowed = options.sheetAllowedDetents,
    sheetAllowedDetents = _options$sheetAllowed === void 0 ? 'large' : _options$sheetAllowed,
    _options$sheetLargest = options.sheetLargestUndimmedDetent,
    sheetLargestUndimmedDetent = _options$sheetLargest === void 0 ? 'all' : _options$sheetLargest,
    _options$sheetGrabber = options.sheetGrabberVisible,
    sheetGrabberVisible = _options$sheetGrabber === void 0 ? false : _options$sheetGrabber,
    _options$sheetCornerR = options.sheetCornerRadius,
    sheetCornerRadius = _options$sheetCornerR === void 0 ? -1.0 : _options$sheetCornerR,
    _options$sheetExpands = options.sheetExpandsWhenScrolledToEdge,
    sheetExpandsWhenScrolledToEdge = _options$sheetExpands === void 0 ? true : _options$sheetExpands,
    _options$nativeBackBu = options.nativeBackButtonDismissalEnabled,
    nativeBackButtonDismissalEnabled = _options$nativeBackBu === void 0 ? false : _options$nativeBackBu,
    navigationBarColor = options.navigationBarColor,
    navigationBarHidden = options.navigationBarHidden,
    _options$replaceAnima = options.replaceAnimation,
    replaceAnimation = _options$replaceAnima === void 0 ? 'pop' : _options$replaceAnima,
    screenOrientation = options.screenOrientation,
    statusBarAnimation = options.statusBarAnimation,
    statusBarColor = options.statusBarColor,
    statusBarHidden = options.statusBarHidden,
    statusBarStyle = options.statusBarStyle,
    statusBarTranslucent = options.statusBarTranslucent,
    _options$swipeDirecti = options.swipeDirection,
    swipeDirection = _options$swipeDirecti === void 0 ? 'horizontal' : _options$swipeDirecti,
    transitionDuration = options.transitionDuration,
    freezeOnBlur = options.freezeOnBlur;
  var customAnimationOnSwipe = options.customAnimationOnSwipe,
    fullScreenSwipeEnabled = options.fullScreenSwipeEnabled,
    gestureResponseDistance = options.gestureResponseDistance,
    stackAnimation = options.stackAnimation,
    _options$stackPresent = options.stackPresentation,
    stackPresentation = _options$stackPresent === void 0 ? 'push' : _options$stackPresent;
  if (swipeDirection === 'vertical') {
    if (fullScreenSwipeEnabled === undefined) {
      fullScreenSwipeEnabled = true;
    }
    if (customAnimationOnSwipe === undefined) {
      customAnimationOnSwipe = true;
    }
    if (stackAnimation === undefined) {
      stackAnimation = 'slide_from_bottom';
    }
  }
  if (index === 0) {
    stackPresentation = 'push';
  }
  var isHeaderInPush = isAndroid ? headerShown : stackPresentation === 'push' && headerShown !== false;
  var dimensions = (0, _reactNativeSafeAreaContext.useSafeAreaFrame)();
  var topInset = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)().top;
  var headerHeight = (0, _getDefaultHeaderHeight.default)(dimensions, topInset, stackPresentation);
  var parentHeaderHeight = React.useContext(_HeaderHeightContext.default);
  var Screen = React.useContext(_reactNativeScreens.ScreenContext);
  var _useTheme2 = (0, _native.useTheme)(),
    dark = _useTheme2.dark;
  return (0, _jsxRuntime.jsx)(Screen, {
    enabled: true,
    isNativeStack: true,
    style: _reactNative.StyleSheet.absoluteFill,
    sheetAllowedDetents: sheetAllowedDetents,
    sheetLargestUndimmedDetent: sheetLargestUndimmedDetent,
    sheetGrabberVisible: sheetGrabberVisible,
    sheetCornerRadius: sheetCornerRadius,
    sheetExpandsWhenScrolledToEdge: sheetExpandsWhenScrolledToEdge,
    customAnimationOnSwipe: customAnimationOnSwipe,
    freezeOnBlur: freezeOnBlur,
    fullScreenSwipeEnabled: fullScreenSwipeEnabled,
    hideKeyboardOnSwipe: hideKeyboardOnSwipe,
    homeIndicatorHidden: homeIndicatorHidden,
    gestureEnabled: isAndroid ? false : gestureEnabled,
    gestureResponseDistance: gestureResponseDistance,
    nativeBackButtonDismissalEnabled: nativeBackButtonDismissalEnabled,
    navigationBarColor: navigationBarColor,
    navigationBarHidden: navigationBarHidden,
    replaceAnimation: replaceAnimation,
    screenOrientation: screenOrientation,
    stackAnimation: stackAnimation,
    stackPresentation: stackPresentation,
    statusBarAnimation: statusBarAnimation,
    statusBarColor: statusBarColor,
    statusBarHidden: statusBarHidden,
    statusBarStyle: statusBarStyle != null ? statusBarStyle : dark ? 'light' : 'dark',
    statusBarTranslucent: statusBarTranslucent,
    swipeDirection: swipeDirection,
    transitionDuration: transitionDuration,
    onHeaderBackButtonClicked: function onHeaderBackButtonClicked() {
      navigation.dispatch(Object.assign({}, _native.StackActions.pop(), {
        source: route.key,
        target: stateKey
      }));
    },
    onWillAppear: function onWillAppear() {
      navigation.emit({
        type: 'transitionStart',
        data: {
          closing: false
        },
        target: route.key
      });
    },
    onWillDisappear: function onWillDisappear() {
      navigation.emit({
        type: 'transitionStart',
        data: {
          closing: true
        },
        target: route.key
      });
    },
    onAppear: function onAppear() {
      navigation.emit({
        type: 'appear',
        target: route.key
      });
      navigation.emit({
        type: 'transitionEnd',
        data: {
          closing: false
        },
        target: route.key
      });
    },
    onDisappear: function onDisappear() {
      navigation.emit({
        type: 'transitionEnd',
        data: {
          closing: true
        },
        target: route.key
      });
    },
    onDismissed: function onDismissed(e) {
      navigation.emit({
        type: 'dismiss',
        target: route.key
      });
      var dismissCount = e.nativeEvent.dismissCount > 0 ? e.nativeEvent.dismissCount : 1;
      navigation.dispatch(Object.assign({}, _native.StackActions.pop(dismissCount), {
        source: route.key,
        target: stateKey
      }));
    },
    children: (0, _jsxRuntime.jsxs)(_HeaderHeightContext.default.Provider, {
      value: isHeaderInPush !== false ? headerHeight : parentHeaderHeight != null ? parentHeaderHeight : 0,
      children: [(0, _jsxRuntime.jsx)(_HeaderConfig.default, Object.assign({}, options, {
        route: route,
        headerShown: isHeaderInPush
      })), (0, _jsxRuntime.jsx)(MaybeNestedStack, {
        options: options,
        route: route,
        stackPresentation: stackPresentation,
        children: renderScene()
      })]
    })
  }, route.key);
};
function NativeStackViewInner(_ref3) {
  var state = _ref3.state,
    navigation = _ref3.navigation,
    descriptors = _ref3.descriptors;
  var key = state.key,
    routes = state.routes;
  return (0, _jsxRuntime.jsx)(_reactNativeScreens.ScreenStack, {
    style: styles.container,
    children: routes.map(function (route, index) {
      return (0, _jsxRuntime.jsx)(RouteView, {
        descriptors: descriptors,
        route: route,
        index: index,
        navigation: navigation,
        stateKey: key
      }, route.key);
    })
  });
}
function NativeStackView(props) {
  return (0, _jsxRuntime.jsx)(_SafeAreaProviderCompat.default, {
    children: (0, _jsxRuntime.jsx)(NativeStackViewInner, Object.assign({}, props))
  });
}
var styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  }
});