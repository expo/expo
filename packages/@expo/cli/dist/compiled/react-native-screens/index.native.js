var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactFreeze = require("react-freeze");
var _package = require("react-native/package.json");
var _TransitionProgressContext = _interopRequireDefault(require("./TransitionProgressContext"));
var _useTransitionProgress = _interopRequireDefault(require("./useTransitionProgress"));
var _utils = require("./utils");
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["children"],
  _excluded2 = ["enabled", "freezeOnBlur"],
  _excluded3 = ["active", "activityState", "children", "isNativeStack", "gestureResponseDistance"],
  _excluded4 = ["active", "activityState", "style", "onComponentRef"],
  _excluded5 = ["enabled", "hasTwoStates"];
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var isPlatformSupported = _reactNative.Platform.OS === 'ios' || _reactNative.Platform.OS === 'android' || _reactNative.Platform.OS === 'windows';
var ENABLE_SCREENS = isPlatformSupported;
function enableScreens() {
  var shouldEnableScreens = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  ENABLE_SCREENS = isPlatformSupported && shouldEnableScreens;
  if (ENABLE_SCREENS && !_reactNative.UIManager.getViewManagerConfig('RNSScreen')) {
    console.error(`Screen native module hasn't been linked. Please check the react-native-screens README for more details`);
  }
}
var ENABLE_FREEZE = false;
function enableFreeze() {
  var shouldEnableReactFreeze = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  var minor = parseInt(_package.version.split('.')[1]);
  if (!(minor === 0 || minor >= 64) && shouldEnableReactFreeze) {
    console.warn('react-freeze library requires at least react-native 0.64. Please upgrade your react-native version in order to use this feature.');
  }
  ENABLE_FREEZE = shouldEnableReactFreeze;
}
var shouldUseActivityState = true;
function screensEnabled() {
  return ENABLE_SCREENS;
}
var NativeScreenValue;
var NativeScreenContainerValue;
var NativeScreenNavigationContainerValue;
var NativeScreenStack;
var NativeScreenStackHeaderConfig;
var NativeScreenStackHeaderSubview;
var AnimatedNativeScreen;
var NativeSearchBar;
var NativeSearchBarCommands;
var NativeFullWindowOverlay;
var ScreensNativeModules = {
  get NativeScreen() {
    NativeScreenValue = NativeScreenValue || require('./fabric/ScreenNativeComponent').default;
    return NativeScreenValue;
  },
  get NativeScreenContainer() {
    NativeScreenContainerValue = NativeScreenContainerValue || require('./fabric/ScreenContainerNativeComponent').default;
    return NativeScreenContainerValue;
  },
  get NativeScreenNavigationContainer() {
    NativeScreenNavigationContainerValue = NativeScreenNavigationContainerValue || (_reactNative.Platform.OS === 'ios' ? (0, _reactNative.requireNativeComponent)('RNSScreenNavigationContainer') : this.NativeScreenContainer);
    return NativeScreenNavigationContainerValue;
  },
  get NativeScreenStack() {
    NativeScreenStack = NativeScreenStack || (0, _reactNative.requireNativeComponent)('RNSScreenStack');
    return NativeScreenStack;
  },
  get NativeScreenStackHeaderConfig() {
    NativeScreenStackHeaderConfig = NativeScreenStackHeaderConfig || (0, _reactNative.requireNativeComponent)('RNSScreenStackHeaderConfig');
    return NativeScreenStackHeaderConfig;
  },
  get NativeScreenStackHeaderSubview() {
    NativeScreenStackHeaderSubview = NativeScreenStackHeaderSubview || (0, _reactNative.requireNativeComponent)('RNSScreenStackHeaderSubview');
    return NativeScreenStackHeaderSubview;
  },
  get NativeSearchBar() {
    NativeSearchBar = NativeSearchBar || require('./fabric/SearchBarNativeComponent').default;
    return NativeSearchBar;
  },
  get NativeSearchBarCommands() {
    NativeSearchBarCommands = NativeSearchBarCommands || require('./fabric/SearchBarNativeComponent').Commands;
    return NativeSearchBarCommands;
  },
  get NativeFullWindowOverlay() {
    NativeFullWindowOverlay = NativeFullWindowOverlay || (0, _reactNative.requireNativeComponent)('RNSFullWindowOverlay');
    return NativeFullWindowOverlay;
  }
};
function DelayedFreeze(_ref) {
  var freeze = _ref.freeze,
    children = _ref.children;
  var _React$useState = _react.default.useState(false),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    freezeState = _React$useState2[0],
    setFreezeState = _React$useState2[1];
  if (freeze !== freezeState) {
    setImmediate(function () {
      setFreezeState(freeze);
    });
  }
  return (0, _jsxRuntime.jsx)(_reactFreeze.Freeze, {
    freeze: freeze ? freezeState : false,
    children: children
  });
}
function ScreenStack(props) {
  var children = props.children,
    rest = (0, _objectWithoutProperties2.default)(props, _excluded);
  var size = _react.default.Children.count(children);
  var childrenWithFreeze = _react.default.Children.map(children, function (child, index) {
    var _props$descriptor, _props$descriptors, _descriptor$options$f, _descriptor$options;
    var props = child.props,
      key = child.key;
    var descriptor = (_props$descriptor = props == null ? void 0 : props.descriptor) != null ? _props$descriptor : props == null ? void 0 : (_props$descriptors = props.descriptors) == null ? void 0 : _props$descriptors[key];
    var freezeEnabled = (_descriptor$options$f = descriptor == null ? void 0 : (_descriptor$options = descriptor.options) == null ? void 0 : _descriptor$options.freezeOnBlur) != null ? _descriptor$options$f : ENABLE_FREEZE;
    return (0, _jsxRuntime.jsx)(DelayedFreeze, {
      freeze: freezeEnabled && size - index > 1,
      children: child
    });
  });
  return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeScreenStack, Object.assign({}, rest, {
    children: childrenWithFreeze
  }));
}
var InnerScreen = function (_React$Component) {
  (0, _inherits2.default)(InnerScreen, _React$Component);
  var _super = _createSuper(InnerScreen);
  function InnerScreen() {
    var _this;
    (0, _classCallCheck2.default)(this, InnerScreen);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.ref = null;
    _this.closing = new _reactNative.Animated.Value(0);
    _this.progress = new _reactNative.Animated.Value(0);
    _this.goingForward = new _reactNative.Animated.Value(0);
    _this.setRef = function (ref) {
      _this.ref = ref;
      _this.props.onComponentRef == null ? void 0 : _this.props.onComponentRef(ref);
    };
    return _this;
  }
  (0, _createClass2.default)(InnerScreen, [{
    key: "setNativeProps",
    value: function setNativeProps(props) {
      var _this$ref;
      (_this$ref = this.ref) == null ? void 0 : _this$ref.setNativeProps(props);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;
      var _this$props = this.props,
        _this$props$enabled = _this$props.enabled,
        enabled = _this$props$enabled === void 0 ? ENABLE_SCREENS : _this$props$enabled,
        _this$props$freezeOnB = _this$props.freezeOnBlur,
        freezeOnBlur = _this$props$freezeOnB === void 0 ? ENABLE_FREEZE : _this$props$freezeOnB,
        rest = (0, _objectWithoutProperties2.default)(_this$props, _excluded2);
      if (enabled && isPlatformSupported) {
        var _gestureResponseDista, _gestureResponseDista2, _gestureResponseDista3, _gestureResponseDista4;
        AnimatedNativeScreen = AnimatedNativeScreen || _reactNative.Animated.createAnimatedComponent(ScreensNativeModules.NativeScreen);
        var active = rest.active,
          activityState = rest.activityState,
          children = rest.children,
          isNativeStack = rest.isNativeStack,
          gestureResponseDistance = rest.gestureResponseDistance,
          props = (0, _objectWithoutProperties2.default)(rest, _excluded3);
        if (active !== undefined && activityState === undefined) {
          console.warn('It appears that you are using old version of react-navigation library. Please update @react-navigation/bottom-tabs, @react-navigation/stack and @react-navigation/drawer to version 5.10.0 or above to take full advantage of new functionality added to react-native-screens');
          activityState = active !== 0 ? 2 : 0;
        }
        var handleRef = function handleRef(ref) {
          var _ref$viewConfig, _ref$viewConfig$valid;
          if (ref != null && (_ref$viewConfig = ref.viewConfig) != null && (_ref$viewConfig$valid = _ref$viewConfig.validAttributes) != null && _ref$viewConfig$valid.style) {
            ref.viewConfig.validAttributes.style = Object.assign({}, ref.viewConfig.validAttributes.style, {
              display: false
            });
            _this2.setRef(ref);
          }
        };
        return (0, _jsxRuntime.jsx)(DelayedFreeze, {
          freeze: freezeOnBlur && activityState === 0,
          children: (0, _jsxRuntime.jsx)(AnimatedNativeScreen, Object.assign({}, props, {
            activityState: activityState,
            gestureResponseDistance: {
              start: (_gestureResponseDista = gestureResponseDistance == null ? void 0 : gestureResponseDistance.start) != null ? _gestureResponseDista : -1,
              end: (_gestureResponseDista2 = gestureResponseDistance == null ? void 0 : gestureResponseDistance.end) != null ? _gestureResponseDista2 : -1,
              top: (_gestureResponseDista3 = gestureResponseDistance == null ? void 0 : gestureResponseDistance.top) != null ? _gestureResponseDista3 : -1,
              bottom: (_gestureResponseDista4 = gestureResponseDistance == null ? void 0 : gestureResponseDistance.bottom) != null ? _gestureResponseDista4 : -1
            },
            ref: handleRef,
            onTransitionProgress: !isNativeStack ? undefined : _reactNative.Animated.event([{
              nativeEvent: {
                progress: this.progress,
                closing: this.closing,
                goingForward: this.goingForward
              }
            }], {
              useNativeDriver: true
            }),
            children: !isNativeStack ? children : (0, _jsxRuntime.jsx)(_TransitionProgressContext.default.Provider, {
              value: {
                progress: this.progress,
                closing: this.closing,
                goingForward: this.goingForward
              },
              children: children
            })
          }))
        });
      } else {
        var _active = rest.active,
          _activityState = rest.activityState,
          style = rest.style,
          onComponentRef = rest.onComponentRef,
          _props = (0, _objectWithoutProperties2.default)(rest, _excluded4);
        if (_active !== undefined && _activityState === undefined) {
          _activityState = _active !== 0 ? 2 : 0;
        }
        return (0, _jsxRuntime.jsx)(_reactNative.Animated.View, Object.assign({
          style: [style, {
            display: _activityState !== 0 ? 'flex' : 'none'
          }],
          ref: this.setRef
        }, _props));
      }
    }
  }]);
  return InnerScreen;
}(_react.default.Component);
function ScreenContainer(props) {
  var _props$enabled = props.enabled,
    enabled = _props$enabled === void 0 ? ENABLE_SCREENS : _props$enabled,
    hasTwoStates = props.hasTwoStates,
    rest = (0, _objectWithoutProperties2.default)(props, _excluded5);
  if (enabled && isPlatformSupported) {
    if (hasTwoStates) {
      return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeScreenNavigationContainer, Object.assign({}, rest));
    }
    return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeScreenContainer, Object.assign({}, rest));
  }
  return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, rest));
}
function FullWindowOverlay(props) {
  if (_reactNative.Platform.OS !== 'ios') {
    console.warn('Importing FullWindowOverlay is only valid on iOS devices.');
    return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, props));
  }
  return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeFullWindowOverlay, {
    style: {
      position: 'absolute',
      width: '100%',
      height: '100%'
    },
    children: props.children
  });
}
var styles = _reactNative.StyleSheet.create({
  headerSubview: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
var ScreenStackHeaderBackButtonImage = function ScreenStackHeaderBackButtonImage(props) {
  return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeScreenStackHeaderSubview, {
    type: "back",
    style: styles.headerSubview,
    children: (0, _jsxRuntime.jsx)(_reactNative.Image, Object.assign({
      resizeMode: "center",
      fadeDuration: 0
    }, props))
  });
};
var SearchBar = function (_React$Component2) {
  (0, _inherits2.default)(SearchBar, _React$Component2);
  var _super2 = _createSuper(SearchBar);
  function SearchBar(props) {
    var _this3;
    (0, _classCallCheck2.default)(this, SearchBar);
    _this3 = _super2.call(this, props);
    _this3.nativeSearchBarRef = _react.default.createRef();
    return _this3;
  }
  (0, _createClass2.default)(SearchBar, [{
    key: "_callMethodWithRef",
    value: function _callMethodWithRef(method) {
      var ref = this.nativeSearchBarRef.current;
      if (ref) {
        method(ref);
      } else {
        console.warn('Reference to native search bar component has not been updated yet');
      }
    }
  }, {
    key: "blur",
    value: function blur() {
      this._callMethodWithRef(function (ref) {
        return ScreensNativeModules.NativeSearchBarCommands.blur(ref);
      });
    }
  }, {
    key: "focus",
    value: function focus() {
      this._callMethodWithRef(function (ref) {
        return ScreensNativeModules.NativeSearchBarCommands.focus(ref);
      });
    }
  }, {
    key: "toggleCancelButton",
    value: function toggleCancelButton(flag) {
      this._callMethodWithRef(function (ref) {
        return ScreensNativeModules.NativeSearchBarCommands.toggleCancelButton(ref, flag);
      });
    }
  }, {
    key: "clearText",
    value: function clearText() {
      this._callMethodWithRef(function (ref) {
        return ScreensNativeModules.NativeSearchBarCommands.clearText(ref);
      });
    }
  }, {
    key: "setText",
    value: function setText(text) {
      this._callMethodWithRef(function (ref) {
        return ScreensNativeModules.NativeSearchBarCommands.setText(ref, text);
      });
    }
  }, {
    key: "render",
    value: function render() {
      if (!_utils.isSearchBarAvailableForCurrentPlatform) {
        console.warn('Importing SearchBar is only valid on iOS and Android devices.');
        return _reactNative.View;
      }
      return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeSearchBar, Object.assign({}, this.props, {
        ref: this.nativeSearchBarRef
      }));
    }
  }]);
  return SearchBar;
}(_react.default.Component);
var ScreenStackHeaderRightView = function ScreenStackHeaderRightView(props) {
  return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeScreenStackHeaderSubview, Object.assign({}, props, {
    type: "right",
    style: styles.headerSubview
  }));
};
var ScreenStackHeaderLeftView = function ScreenStackHeaderLeftView(props) {
  return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeScreenStackHeaderSubview, Object.assign({}, props, {
    type: "left",
    style: styles.headerSubview
  }));
};
var ScreenStackHeaderCenterView = function ScreenStackHeaderCenterView(props) {
  return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeScreenStackHeaderSubview, Object.assign({}, props, {
    type: "center",
    style: styles.headerSubview
  }));
};
var ScreenStackHeaderSearchBarView = function ScreenStackHeaderSearchBarView(props) {
  return (0, _jsxRuntime.jsx)(ScreensNativeModules.NativeScreenStackHeaderSubview, Object.assign({}, props, {
    type: "searchBar",
    style: styles.headerSubview
  }));
};
var ScreenContext = _react.default.createContext(InnerScreen);
var Screen = function (_React$Component3) {
  (0, _inherits2.default)(Screen, _React$Component3);
  var _super3 = _createSuper(Screen);
  function Screen() {
    (0, _classCallCheck2.default)(this, Screen);
    return _super3.apply(this, arguments);
  }
  (0, _createClass2.default)(Screen, [{
    key: "render",
    value: function render() {
      var ScreenWrapper = this.context || InnerScreen;
      return (0, _jsxRuntime.jsx)(ScreenWrapper, Object.assign({}, this.props));
    }
  }]);
  return Screen;
}(_react.default.Component);
Screen.contextType = ScreenContext;
module.exports = {
  Screen: Screen,
  ScreenContainer: ScreenContainer,
  ScreenContext: ScreenContext,
  ScreenStack: ScreenStack,
  InnerScreen: InnerScreen,
  SearchBar: SearchBar,
  FullWindowOverlay: FullWindowOverlay,
  get NativeScreen() {
    return ScreensNativeModules.NativeScreen;
  },
  get NativeScreenContainer() {
    return ScreensNativeModules.NativeScreenContainer;
  },
  get NativeScreenNavigationContainer() {
    return ScreensNativeModules.NativeScreenNavigationContainer;
  },
  get ScreenStackHeaderConfig() {
    return ScreensNativeModules.NativeScreenStackHeaderConfig;
  },
  get ScreenStackHeaderSubview() {
    return ScreensNativeModules.NativeScreenStackHeaderSubview;
  },
  get SearchBarCommands() {
    return ScreensNativeModules.NativeSearchBarCommands;
  },
  ScreenStackHeaderBackButtonImage: ScreenStackHeaderBackButtonImage,
  ScreenStackHeaderRightView: ScreenStackHeaderRightView,
  ScreenStackHeaderLeftView: ScreenStackHeaderLeftView,
  ScreenStackHeaderCenterView: ScreenStackHeaderCenterView,
  ScreenStackHeaderSearchBarView: ScreenStackHeaderSearchBarView,
  enableScreens: enableScreens,
  enableFreeze: enableFreeze,
  screensEnabled: screensEnabled,
  shouldUseActivityState: shouldUseActivityState,
  useTransitionProgress: _useTransitionProgress.default,
  isSearchBarAvailableForCurrentPlatform: _utils.isSearchBarAvailableForCurrentPlatform,
  isNewBackTitleImplementation: _utils.isNewBackTitleImplementation,
  executeNativeBackPress: _utils.executeNativeBackPress
};