var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HeaderConfig;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _native = require("@react-navigation/native");
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeScreens = require("react-native-screens");
var _useBackPressSubscription = require("../utils/useBackPressSubscription");
var _FontProcessor = require("./FontProcessor");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function HeaderConfig(_ref) {
  var backButtonImage = _ref.backButtonImage,
    backButtonInCustomView = _ref.backButtonInCustomView,
    direction = _ref.direction,
    disableBackButtonMenu = _ref.disableBackButtonMenu,
    headerBackTitle = _ref.headerBackTitle,
    _ref$headerBackTitleS = _ref.headerBackTitleStyle,
    headerBackTitleStyle = _ref$headerBackTitleS === void 0 ? {} : _ref$headerBackTitleS,
    _ref$headerBackTitleV = _ref.headerBackTitleVisible,
    headerBackTitleVisible = _ref$headerBackTitleV === void 0 ? true : _ref$headerBackTitleV,
    headerCenter = _ref.headerCenter,
    headerHideBackButton = _ref.headerHideBackButton,
    headerHideShadow = _ref.headerHideShadow,
    _ref$headerLargeStyle = _ref.headerLargeStyle,
    headerLargeStyle = _ref$headerLargeStyle === void 0 ? {} : _ref$headerLargeStyle,
    headerLargeTitle = _ref.headerLargeTitle,
    headerLargeTitleHideShadow = _ref.headerLargeTitleHideShadow,
    _ref$headerLargeTitle = _ref.headerLargeTitleStyle,
    headerLargeTitleStyle = _ref$headerLargeTitle === void 0 ? {} : _ref$headerLargeTitle,
    headerLeft = _ref.headerLeft,
    headerRight = _ref.headerRight,
    headerShown = _ref.headerShown,
    _ref$headerStyle = _ref.headerStyle,
    headerStyle = _ref$headerStyle === void 0 ? {} : _ref$headerStyle,
    headerTintColor = _ref.headerTintColor,
    headerTitle = _ref.headerTitle,
    _ref$headerTitleStyle = _ref.headerTitleStyle,
    headerTitleStyle = _ref$headerTitleStyle === void 0 ? {} : _ref$headerTitleStyle,
    _ref$headerTopInsetEn = _ref.headerTopInsetEnabled,
    headerTopInsetEnabled = _ref$headerTopInsetEn === void 0 ? true : _ref$headerTopInsetEn,
    headerTranslucent = _ref.headerTranslucent,
    route = _ref.route,
    searchBar = _ref.searchBar,
    title = _ref.title;
  var _useTheme = (0, _native.useTheme)(),
    colors = _useTheme.colors;
  var tintColor = headerTintColor != null ? headerTintColor : colors.primary;
  var _useBackPressSubscrip = (0, _useBackPressSubscription.useBackPressSubscription)({
      onBackPress: _reactNativeScreens.executeNativeBackPress,
      isDisabled: !searchBar || !!searchBar.disableBackButtonOverride
    }),
    handleAttached = _useBackPressSubscrip.handleAttached,
    handleDetached = _useBackPressSubscrip.handleDetached,
    clearSubscription = _useBackPressSubscrip.clearSubscription,
    createSubscription = _useBackPressSubscrip.createSubscription;
  var _processFonts = (0, _FontProcessor.processFonts)([headerBackTitleStyle.fontFamily, headerLargeTitleStyle.fontFamily, headerTitleStyle.fontFamily]),
    _processFonts2 = (0, _slicedToArray2.default)(_processFonts, 3),
    backTitleFontFamily = _processFonts2[0],
    largeTitleFontFamily = _processFonts2[1],
    titleFontFamily = _processFonts2[2];
  React.useEffect(function () {
    return clearSubscription;
  }, [searchBar]);
  var processedSearchBarOptions = React.useMemo(function () {
    if (_reactNative.Platform.OS === 'android' && searchBar && !searchBar.disableBackButtonOverride) {
      var onFocus = function onFocus() {
        createSubscription();
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        searchBar.onFocus == null ? void 0 : searchBar.onFocus.apply(searchBar, args);
      };
      var onClose = function onClose() {
        clearSubscription();
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        searchBar.onClose == null ? void 0 : searchBar.onClose.apply(searchBar, args);
      };
      return Object.assign({}, searchBar, {
        onFocus: onFocus,
        onClose: onClose
      });
    }
    return searchBar;
  }, [searchBar, createSubscription, clearSubscription]);
  return (0, _jsxRuntime.jsxs)(_reactNativeScreens.ScreenStackHeaderConfig, {
    backButtonInCustomView: backButtonInCustomView,
    backgroundColor: headerStyle.backgroundColor ? headerStyle.backgroundColor : colors.card,
    backTitle: headerBackTitle,
    backTitleFontFamily: backTitleFontFamily,
    backTitleFontSize: headerBackTitleStyle.fontSize,
    backTitleVisible: headerBackTitleVisible,
    blurEffect: headerStyle.blurEffect,
    color: tintColor,
    direction: direction,
    disableBackButtonMenu: disableBackButtonMenu,
    hidden: headerShown === false,
    hideBackButton: headerHideBackButton,
    hideShadow: headerHideShadow,
    largeTitle: headerLargeTitle,
    largeTitleBackgroundColor: headerLargeStyle.backgroundColor,
    largeTitleColor: headerLargeTitleStyle.color,
    largeTitleFontFamily: largeTitleFontFamily,
    largeTitleFontSize: headerLargeTitleStyle.fontSize,
    largeTitleFontWeight: headerLargeTitleStyle.fontWeight,
    largeTitleHideShadow: headerLargeTitleHideShadow,
    title: headerTitle !== undefined ? headerTitle : title !== undefined ? title : route.name,
    titleColor: headerTitleStyle.color !== undefined ? headerTitleStyle.color : headerTintColor !== undefined ? headerTintColor : colors.text,
    titleFontFamily: titleFontFamily,
    titleFontSize: headerTitleStyle.fontSize,
    titleFontWeight: headerTitleStyle.fontWeight,
    topInsetEnabled: headerTopInsetEnabled,
    translucent: headerTranslucent === true,
    onAttached: handleAttached,
    onDetached: handleDetached,
    children: [headerRight !== undefined ? (0, _jsxRuntime.jsx)(_reactNativeScreens.ScreenStackHeaderRightView, {
      children: headerRight({
        tintColor: tintColor
      })
    }) : null, backButtonImage !== undefined ? (0, _jsxRuntime.jsx)(_reactNativeScreens.ScreenStackHeaderBackButtonImage, {
      source: backButtonImage
    }, "backImage") : null, headerLeft !== undefined ? (0, _jsxRuntime.jsx)(_reactNativeScreens.ScreenStackHeaderLeftView, {
      children: headerLeft({
        tintColor: tintColor
      })
    }) : null, headerCenter !== undefined ? (0, _jsxRuntime.jsx)(_reactNativeScreens.ScreenStackHeaderCenterView, {
      children: headerCenter({
        tintColor: tintColor
      })
    }) : null, _reactNativeScreens.isSearchBarAvailableForCurrentPlatform && processedSearchBarOptions !== undefined ? (0, _jsxRuntime.jsx)(_reactNativeScreens.ScreenStackHeaderSearchBarView, {
      children: (0, _jsxRuntime.jsx)(_reactNativeScreens.SearchBar, Object.assign({}, processedSearchBarOptions))
    }) : null]
  });
}