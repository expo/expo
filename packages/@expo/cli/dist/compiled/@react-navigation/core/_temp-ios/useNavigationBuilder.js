var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useNavigationBuilder;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _routers = require("@react-navigation/routers");
var React = _interopRequireWildcard(require("react"));
var _reactIs = require("react-is");
var _Group = _interopRequireDefault(require("./Group"));
var _isArrayEqual = _interopRequireDefault(require("./isArrayEqual"));
var _isRecordEqual = _interopRequireDefault(require("./isRecordEqual"));
var _NavigationHelpersContext = _interopRequireDefault(require("./NavigationHelpersContext"));
var _NavigationRouteContext = _interopRequireDefault(require("./NavigationRouteContext"));
var _NavigationStateContext = _interopRequireDefault(require("./NavigationStateContext"));
var _PreventRemoveProvider = _interopRequireDefault(require("./PreventRemoveProvider"));
var _Screen = _interopRequireDefault(require("./Screen"));
var _types = require("./types");
var _useChildListeners2 = _interopRequireDefault(require("./useChildListeners"));
var _useComponent = _interopRequireDefault(require("./useComponent"));
var _useCurrentRender = _interopRequireDefault(require("./useCurrentRender"));
var _useDescriptors = _interopRequireDefault(require("./useDescriptors"));
var _useEventEmitter = _interopRequireDefault(require("./useEventEmitter"));
var _useFocusedListenersChildrenAdapter = _interopRequireDefault(require("./useFocusedListenersChildrenAdapter"));
var _useFocusEvents = _interopRequireDefault(require("./useFocusEvents"));
var _useKeyedChildListeners = _interopRequireDefault(require("./useKeyedChildListeners"));
var _useNavigationHelpers = _interopRequireDefault(require("./useNavigationHelpers"));
var _useOnAction = _interopRequireDefault(require("./useOnAction"));
var _useOnGetState = _interopRequireDefault(require("./useOnGetState"));
var _useOnRouteFocus = _interopRequireDefault(require("./useOnRouteFocus"));
var _useRegisterNavigator = _interopRequireDefault(require("./useRegisterNavigator"));
var _useScheduleUpdate = _interopRequireDefault(require("./useScheduleUpdate"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["children", "screenListeners"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
_types.PrivateValueStore;
var isValidKey = function isValidKey(key) {
  return key === undefined || typeof key === 'string' && key !== '';
};
var getRouteConfigsFromChildren = function getRouteConfigsFromChildren(children, groupKey, groupOptions) {
  var configs = React.Children.toArray(children).reduce(function (acc, child) {
    var _child$type, _child$props;
    if (React.isValidElement(child)) {
      if (child.type === _Screen.default) {
        if (!isValidKey(child.props.navigationKey)) {
          throw new Error(`Got an invalid 'navigationKey' prop (${JSON.stringify(child.props.navigationKey)}) for the screen '${child.props.name}'. It must be a non-empty string or 'undefined'.`);
        }
        acc.push({
          keys: [groupKey, child.props.navigationKey],
          options: groupOptions,
          props: child.props
        });
        return acc;
      }
      if (child.type === React.Fragment || child.type === _Group.default) {
        if (!isValidKey(child.props.navigationKey)) {
          throw new Error(`Got an invalid 'navigationKey' prop (${JSON.stringify(child.props.navigationKey)}) for the group. It must be a non-empty string or 'undefined'.`);
        }
        acc.push.apply(acc, (0, _toConsumableArray2.default)(getRouteConfigsFromChildren(child.props.children, child.props.navigationKey, child.type !== _Group.default ? groupOptions : groupOptions != null ? [].concat((0, _toConsumableArray2.default)(groupOptions), [child.props.screenOptions]) : [child.props.screenOptions])));
        return acc;
      }
    }
    throw new Error(`A navigator can only contain 'Screen', 'Group' or 'React.Fragment' as its direct children (found ${React.isValidElement(child) ? `'${typeof child.type === 'string' ? child.type : (_child$type = child.type) == null ? void 0 : _child$type.name}'${child.props != null && typeof child.props === 'object' && 'name' in child.props && (_child$props = child.props) != null && _child$props.name ? ` for the screen '${child.props.name}'` : ''}` : typeof child === 'object' ? JSON.stringify(child) : `'${String(child)}'`}). To render this component in the navigator, pass it in the 'component' prop to 'Screen'.`);
  }, []);
  if (process.env.NODE_ENV !== 'production') {
    configs.forEach(function (config) {
      var _config$props = config.props,
        name = _config$props.name,
        children = _config$props.children,
        component = _config$props.component,
        getComponent = _config$props.getComponent;
      if (typeof name !== 'string' || !name) {
        throw new Error(`Got an invalid name (${JSON.stringify(name)}) for the screen. It must be a non-empty string.`);
      }
      if (children != null || component !== undefined || getComponent !== undefined) {
        if (children != null && component !== undefined) {
          throw new Error(`Got both 'component' and 'children' props for the screen '${name}'. You must pass only one of them.`);
        }
        if (children != null && getComponent !== undefined) {
          throw new Error(`Got both 'getComponent' and 'children' props for the screen '${name}'. You must pass only one of them.`);
        }
        if (component !== undefined && getComponent !== undefined) {
          throw new Error(`Got both 'component' and 'getComponent' props for the screen '${name}'. You must pass only one of them.`);
        }
        if (children != null && typeof children !== 'function') {
          throw new Error(`Got an invalid value for 'children' prop for the screen '${name}'. It must be a function returning a React Element.`);
        }
        if (component !== undefined && !(0, _reactIs.isValidElementType)(component)) {
          throw new Error(`Got an invalid value for 'component' prop for the screen '${name}'. It must be a valid React Component.`);
        }
        if (getComponent !== undefined && typeof getComponent !== 'function') {
          throw new Error(`Got an invalid value for 'getComponent' prop for the screen '${name}'. It must be a function returning a React Component.`);
        }
        if (typeof component === 'function') {
          if (component.name === 'component') {
            console.warn(`Looks like you're passing an inline function for 'component' prop for the screen '${name}' (e.g. component={() => <SomeComponent />}). Passing an inline function will cause the component state to be lost on re-render and cause perf issues since it's re-created every render. You can pass the function as children to 'Screen' instead to achieve the desired behaviour.`);
          } else if (/^[a-z]/.test(component.name)) {
            console.warn(`Got a component with the name '${component.name}' for the screen '${name}'. React Components must start with an uppercase letter. If you're passing a regular function and not a component, pass it as children to 'Screen' instead. Otherwise capitalize your component's name.`);
          }
        }
      } else {
        throw new Error(`Couldn't find a 'component', 'getComponent' or 'children' prop for the screen '${name}'. This can happen if you passed 'undefined'. You likely forgot to export your component from the file it's defined in, or mixed up default import and named import when importing.`);
      }
    });
  }
  return configs;
};
function useNavigationBuilder(createRouter, options) {
  var navigatorKey = (0, _useRegisterNavigator.default)();
  var route = React.useContext(_NavigationRouteContext.default);
  var children = options.children,
    screenListeners = options.screenListeners,
    rest = (0, _objectWithoutProperties2.default)(options, _excluded);
  var _React$useRef = React.useRef(createRouter(Object.assign({}, rest, route != null && route.params && route.params.state == null && route.params.initial !== false && typeof route.params.screen === 'string' ? {
      initialRouteName: route.params.screen
    } : null))),
    router = _React$useRef.current;
  var routeConfigs = getRouteConfigsFromChildren(children);
  var screens = routeConfigs.reduce(function (acc, config) {
    if (config.props.name in acc) {
      throw new Error(`A navigator cannot contain multiple 'Screen' components with the same name (found duplicate screen named '${config.props.name}')`);
    }
    acc[config.props.name] = config;
    return acc;
  }, {});
  var routeNames = routeConfigs.map(function (config) {
    return config.props.name;
  });
  var routeKeyList = routeNames.reduce(function (acc, curr) {
    acc[curr] = screens[curr].keys.map(function (key) {
      return key != null ? key : '';
    }).join(':');
    return acc;
  }, {});
  var routeParamList = routeNames.reduce(function (acc, curr) {
    var initialParams = screens[curr].props.initialParams;
    acc[curr] = initialParams;
    return acc;
  }, {});
  var routeGetIdList = routeNames.reduce(function (acc, curr) {
    return Object.assign(acc, (0, _defineProperty2.default)({}, curr, screens[curr].props.getId));
  }, {});
  if (!routeNames.length) {
    throw new Error("Couldn't find any screens for the navigator. Have you defined any screens as its children?");
  }
  var isStateValid = React.useCallback(function (state) {
    return state.type === undefined || state.type === router.type;
  }, [router.type]);
  var isStateInitialized = React.useCallback(function (state) {
    return state !== undefined && state.stale === false && isStateValid(state);
  }, [isStateValid]);
  var _React$useContext = React.useContext(_NavigationStateContext.default),
    currentState = _React$useContext.state,
    getCurrentState = _React$useContext.getState,
    setCurrentState = _React$useContext.setState,
    setKey = _React$useContext.setKey,
    getKey = _React$useContext.getKey,
    getIsInitial = _React$useContext.getIsInitial;
  var stateCleanedUp = React.useRef(false);
  var cleanUpState = React.useCallback(function () {
    setCurrentState(undefined);
    stateCleanedUp.current = true;
  }, [setCurrentState]);
  var setState = React.useCallback(function (state) {
    if (stateCleanedUp.current) {
      return;
    }
    setCurrentState(state);
  }, [setCurrentState]);
  var _React$useMemo = React.useMemo(function () {
      var _route$params4;
      var initialRouteParamList = routeNames.reduce(function (acc, curr) {
        var _route$params, _route$params2, _route$params3;
        var initialParams = screens[curr].props.initialParams;
        var initialParamsFromParams = (route == null ? void 0 : (_route$params = route.params) == null ? void 0 : _route$params.state) == null && (route == null ? void 0 : (_route$params2 = route.params) == null ? void 0 : _route$params2.initial) !== false && (route == null ? void 0 : (_route$params3 = route.params) == null ? void 0 : _route$params3.screen) === curr ? route.params.params : undefined;
        acc[curr] = initialParams !== undefined || initialParamsFromParams !== undefined ? Object.assign({}, initialParams, initialParamsFromParams) : undefined;
        return acc;
      }, {});
      if ((currentState === undefined || !isStateValid(currentState)) && (route == null ? void 0 : (_route$params4 = route.params) == null ? void 0 : _route$params4.state) == null) {
        return [router.getInitialState({
          routeNames: routeNames,
          routeParamList: initialRouteParamList,
          routeGetIdList: routeGetIdList
        }), true];
      } else {
        var _route$params$state, _route$params5;
        return [router.getRehydratedState((_route$params$state = route == null ? void 0 : (_route$params5 = route.params) == null ? void 0 : _route$params5.state) != null ? _route$params$state : currentState, {
          routeNames: routeNames,
          routeParamList: initialRouteParamList,
          routeGetIdList: routeGetIdList
        }), false];
      }
    }, [currentState, router, isStateValid]),
    _React$useMemo2 = (0, _slicedToArray2.default)(_React$useMemo, 2),
    initializedState = _React$useMemo2[0],
    isFirstStateInitialization = _React$useMemo2[1];
  var previousRouteKeyListRef = React.useRef(routeKeyList);
  React.useEffect(function () {
    previousRouteKeyListRef.current = routeKeyList;
  });
  var previousRouteKeyList = previousRouteKeyListRef.current;
  var state = isStateInitialized(currentState) ? currentState : initializedState;
  var nextState = state;
  if (!(0, _isArrayEqual.default)(state.routeNames, routeNames) || !(0, _isRecordEqual.default)(routeKeyList, previousRouteKeyList)) {
    nextState = router.getStateForRouteNamesChange(state, {
      routeNames: routeNames,
      routeParamList: routeParamList,
      routeGetIdList: routeGetIdList,
      routeKeyChanges: Object.keys(routeKeyList).filter(function (name) {
        return previousRouteKeyList.hasOwnProperty(name) && routeKeyList[name] !== previousRouteKeyList[name];
      })
    });
  }
  var previousNestedParamsRef = React.useRef(route == null ? void 0 : route.params);
  React.useEffect(function () {
    previousNestedParamsRef.current = route == null ? void 0 : route.params;
  }, [route == null ? void 0 : route.params]);
  if (route != null && route.params) {
    var previousParams = previousNestedParamsRef.current;
    var action;
    if (typeof route.params.state === 'object' && route.params.state != null && route.params !== previousParams) {
      action = _routers.CommonActions.reset(route.params.state);
    } else if (typeof route.params.screen === 'string' && (route.params.initial === false && isFirstStateInitialization || route.params !== previousParams)) {
      action = _routers.CommonActions.navigate({
        name: route.params.screen,
        params: route.params.params,
        path: route.params.path
      });
    }
    var updatedState = action ? router.getStateForAction(nextState, action, {
      routeNames: routeNames,
      routeParamList: routeParamList,
      routeGetIdList: routeGetIdList
    }) : null;
    nextState = updatedState !== null ? router.getRehydratedState(updatedState, {
      routeNames: routeNames,
      routeParamList: routeParamList,
      routeGetIdList: routeGetIdList
    }) : nextState;
  }
  var shouldUpdate = state !== nextState;
  (0, _useScheduleUpdate.default)(function () {
    if (shouldUpdate) {
      setState(nextState);
    }
  });
  state = nextState;
  React.useEffect(function () {
    setKey(navigatorKey);
    if (!getIsInitial()) {
      setState(nextState);
    }
    return function () {
      setTimeout(function () {
        if (getCurrentState() !== undefined && getKey() === navigatorKey) {
          cleanUpState();
        }
      }, 0);
    };
  }, []);
  var initializedStateRef = React.useRef();
  initializedStateRef.current = initializedState;
  var getState = React.useCallback(function () {
    var currentState = getCurrentState();
    return isStateInitialized(currentState) ? currentState : initializedStateRef.current;
  }, [getCurrentState, isStateInitialized]);
  var emitter = (0, _useEventEmitter.default)(function (e) {
    var _ref;
    var routeNames = [];
    var route;
    if (e.target) {
      var _route;
      route = state.routes.find(function (route) {
        return route.key === e.target;
      });
      if ((_route = route) != null && _route.name) {
        routeNames.push(route.name);
      }
    } else {
      route = state.routes[state.index];
      routeNames.push.apply(routeNames, (0, _toConsumableArray2.default)(Object.keys(screens).filter(function (name) {
        var _route2;
        return ((_route2 = route) == null ? void 0 : _route2.name) === name;
      })));
    }
    if (route == null) {
      return;
    }
    var navigation = descriptors[route.key].navigation;
    var listeners = (_ref = []).concat.apply(_ref, (0, _toConsumableArray2.default)([screenListeners].concat((0, _toConsumableArray2.default)(routeNames.map(function (name) {
      var listeners = screens[name].props.listeners;
      return listeners;
    }))).map(function (listeners) {
      var map = typeof listeners === 'function' ? listeners({
        route: route,
        navigation: navigation
      }) : listeners;
      return map ? Object.keys(map).filter(function (type) {
        return type === e.type;
      }).map(function (type) {
        return map == null ? void 0 : map[type];
      }) : undefined;
    }))).filter(function (cb, i, self) {
      return cb && self.lastIndexOf(cb) === i;
    });
    listeners.forEach(function (listener) {
      return listener == null ? void 0 : listener(e);
    });
  });
  (0, _useFocusEvents.default)({
    state: state,
    emitter: emitter
  });
  React.useEffect(function () {
    emitter.emit({
      type: 'state',
      data: {
        state: state
      }
    });
  }, [emitter, state]);
  var _useChildListeners = (0, _useChildListeners2.default)(),
    childListeners = _useChildListeners.listeners,
    addListener = _useChildListeners.addListener;
  var _useKeyedChildListene = (0, _useKeyedChildListeners.default)(),
    keyedListeners = _useKeyedChildListene.keyedListeners,
    addKeyedListener = _useKeyedChildListene.addKeyedListener;
  var onAction = (0, _useOnAction.default)({
    router: router,
    getState: getState,
    setState: setState,
    key: route == null ? void 0 : route.key,
    actionListeners: childListeners.action,
    beforeRemoveListeners: keyedListeners.beforeRemove,
    routerConfigOptions: {
      routeNames: routeNames,
      routeParamList: routeParamList,
      routeGetIdList: routeGetIdList
    },
    emitter: emitter
  });
  var onRouteFocus = (0, _useOnRouteFocus.default)({
    router: router,
    key: route == null ? void 0 : route.key,
    getState: getState,
    setState: setState
  });
  var navigation = (0, _useNavigationHelpers.default)({
    id: options.id,
    onAction: onAction,
    getState: getState,
    emitter: emitter,
    router: router
  });
  (0, _useFocusedListenersChildrenAdapter.default)({
    navigation: navigation,
    focusedListeners: childListeners.focus
  });
  (0, _useOnGetState.default)({
    getState: getState,
    getStateListeners: keyedListeners.getState
  });
  var descriptors = (0, _useDescriptors.default)({
    state: state,
    screens: screens,
    navigation: navigation,
    screenOptions: options.screenOptions,
    defaultScreenOptions: options.defaultScreenOptions,
    onAction: onAction,
    getState: getState,
    setState: setState,
    onRouteFocus: onRouteFocus,
    addListener: addListener,
    addKeyedListener: addKeyedListener,
    router: router,
    emitter: emitter
  });
  (0, _useCurrentRender.default)({
    state: state,
    navigation: navigation,
    descriptors: descriptors
  });
  var NavigationContent = (0, _useComponent.default)(function (children) {
    return (0, _jsxRuntime.jsx)(_NavigationHelpersContext.default.Provider, {
      value: navigation,
      children: (0, _jsxRuntime.jsx)(_PreventRemoveProvider.default, {
        children: children
      })
    });
  });
  return {
    state: state,
    navigation: navigation,
    descriptors: descriptors,
    NavigationContent: NavigationContent
  };
}