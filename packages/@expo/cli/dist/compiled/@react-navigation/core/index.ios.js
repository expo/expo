/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 4743:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var _objectWithoutProperties2 = _interopRequireDefault(__nccwpck_require__(8061));
var _routers = __nccwpck_require__(6844);
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _checkDuplicateRouteNames = _interopRequireDefault(__nccwpck_require__(5143));
var _checkSerializable = _interopRequireDefault(__nccwpck_require__(7623));
var _createNavigationContainerRef = __nccwpck_require__(6106);
var _EnsureSingleNavigator = _interopRequireDefault(__nccwpck_require__(3328));
var _findFocusedRoute = _interopRequireDefault(__nccwpck_require__(390));
var _NavigationBuilderContext = _interopRequireDefault(__nccwpck_require__(4421));
var _NavigationContainerRefContext = _interopRequireDefault(__nccwpck_require__(4952));
var _NavigationContext = _interopRequireDefault(__nccwpck_require__(1298));
var _NavigationRouteContext = _interopRequireDefault(__nccwpck_require__(7839));
var _NavigationStateContext = _interopRequireDefault(__nccwpck_require__(4492));
var _UnhandledActionContext = _interopRequireDefault(__nccwpck_require__(1830));
var _useChildListeners2 = _interopRequireDefault(__nccwpck_require__(5691));
var _useEventEmitter = _interopRequireDefault(__nccwpck_require__(7443));
var _useKeyedChildListeners = _interopRequireDefault(__nccwpck_require__(8445));
var _useOptionsGetters2 = _interopRequireDefault(__nccwpck_require__(9660));
var _useScheduleUpdate = __nccwpck_require__(7676);
var _useSyncState3 = _interopRequireDefault(__nccwpck_require__(6015));
var _jsxRuntime = __nccwpck_require__(8872);
var _excluded = ["key", "routeNames"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var serializableWarnings = [];
var duplicateNameWarnings = [];
var getPartialState = function getPartialState(state) {
  if (state === undefined) {
    return;
  }
  var key = state.key,
    routeNames = state.routeNames,
    partialState = (0, _objectWithoutProperties2.default)(state, _excluded);
  return Object.assign({}, partialState, {
    stale: true,
    routes: state.routes.map(function (route) {
      if (route.state === undefined) {
        return route;
      }
      return Object.assign({}, route, {
        state: getPartialState(route.state)
      });
    })
  });
};
var BaseNavigationContainer = React.forwardRef(function BaseNavigationContainer(_ref, ref) {
  var initialState = _ref.initialState,
    onStateChange = _ref.onStateChange,
    onUnhandledAction = _ref.onUnhandledAction,
    independent = _ref.independent,
    children = _ref.children;
  var parent = React.useContext(_NavigationStateContext.default);
  if (!parent.isDefault && !independent) {
    throw new Error("Looks like you have nested a 'NavigationContainer' inside another. Normally you need only one container at the root of the app, so this was probably an error. If this was intentional, pass 'independent={true}' explicitly. Note that this will make the child navigators disconnected from the parent and you won't be able to navigate between them.");
  }
  var _useSyncState = (0, _useSyncState3.default)(function () {
      return getPartialState(initialState == null ? undefined : initialState);
    }),
    _useSyncState2 = (0, _slicedToArray2.default)(_useSyncState, 5),
    state = _useSyncState2[0],
    getState = _useSyncState2[1],
    setState = _useSyncState2[2],
    scheduleUpdate = _useSyncState2[3],
    flushUpdates = _useSyncState2[4];
  var isFirstMountRef = React.useRef(true);
  var navigatorKeyRef = React.useRef();
  var getKey = React.useCallback(function () {
    return navigatorKeyRef.current;
  }, []);
  var setKey = React.useCallback(function (key) {
    navigatorKeyRef.current = key;
  }, []);
  var _useChildListeners = (0, _useChildListeners2.default)(),
    listeners = _useChildListeners.listeners,
    addListener = _useChildListeners.addListener;
  var _useKeyedChildListene = (0, _useKeyedChildListeners.default)(),
    keyedListeners = _useKeyedChildListene.keyedListeners,
    addKeyedListener = _useKeyedChildListene.addKeyedListener;
  var dispatch = React.useCallback(function (action) {
    if (listeners.focus[0] == null) {
      console.error(_createNavigationContainerRef.NOT_INITIALIZED_ERROR);
    } else {
      listeners.focus[0](function (navigation) {
        return navigation.dispatch(action);
      });
    }
  }, [listeners.focus]);
  var canGoBack = React.useCallback(function () {
    if (listeners.focus[0] == null) {
      return false;
    }
    var _listeners$focus$ = listeners.focus[0](function (navigation) {
        return navigation.canGoBack();
      }),
      result = _listeners$focus$.result,
      handled = _listeners$focus$.handled;
    if (handled) {
      return result;
    } else {
      return false;
    }
  }, [listeners.focus]);
  var resetRoot = React.useCallback(function (state) {
    var _state$key;
    var target = (_state$key = state == null ? void 0 : state.key) != null ? _state$key : keyedListeners.getState.root == null ? void 0 : keyedListeners.getState.root().key;
    if (target == null) {
      console.error(_createNavigationContainerRef.NOT_INITIALIZED_ERROR);
    } else {
      listeners.focus[0](function (navigation) {
        return navigation.dispatch(Object.assign({}, _routers.CommonActions.reset(state), {
          target: target
        }));
      });
    }
  }, [keyedListeners.getState, listeners.focus]);
  var getRootState = React.useCallback(function () {
    return keyedListeners.getState.root == null ? void 0 : keyedListeners.getState.root();
  }, [keyedListeners.getState]);
  var getCurrentRoute = React.useCallback(function () {
    var state = getRootState();
    if (state == null) {
      return undefined;
    }
    var route = (0, _findFocusedRoute.default)(state);
    return route;
  }, [getRootState]);
  var emitter = (0, _useEventEmitter.default)();
  var _useOptionsGetters = (0, _useOptionsGetters2.default)({}),
    addOptionsGetter = _useOptionsGetters.addOptionsGetter,
    getCurrentOptions = _useOptionsGetters.getCurrentOptions;
  var navigation = React.useMemo(function () {
    return Object.assign({}, Object.keys(_routers.CommonActions).reduce(function (acc, name) {
      acc[name] = function () {
        return dispatch(_routers.CommonActions[name].apply(_routers.CommonActions, arguments));
      };
      return acc;
    }, {}), emitter.create('root'), {
      dispatch: dispatch,
      resetRoot: resetRoot,
      isFocused: function isFocused() {
        return true;
      },
      canGoBack: canGoBack,
      getParent: function getParent() {
        return undefined;
      },
      getState: function getState() {
        return stateRef.current;
      },
      getRootState: getRootState,
      getCurrentRoute: getCurrentRoute,
      getCurrentOptions: getCurrentOptions,
      isReady: function isReady() {
        return listeners.focus[0] != null;
      }
    });
  }, [canGoBack, dispatch, emitter, getCurrentOptions, getCurrentRoute, getRootState, listeners.focus, resetRoot]);
  React.useImperativeHandle(ref, function () {
    return navigation;
  }, [navigation]);
  var onDispatchAction = React.useCallback(function (action, noop) {
    emitter.emit({
      type: '__unsafe_action__',
      data: {
        action: action,
        noop: noop,
        stack: stackRef.current
      }
    });
  }, [emitter]);
  var lastEmittedOptionsRef = React.useRef();
  var onOptionsChange = React.useCallback(function (options) {
    if (lastEmittedOptionsRef.current === options) {
      return;
    }
    lastEmittedOptionsRef.current = options;
    emitter.emit({
      type: 'options',
      data: {
        options: options
      }
    });
  }, [emitter]);
  var stackRef = React.useRef();
  var builderContext = React.useMemo(function () {
    return {
      addListener: addListener,
      addKeyedListener: addKeyedListener,
      onDispatchAction: onDispatchAction,
      onOptionsChange: onOptionsChange,
      stackRef: stackRef
    };
  }, [addListener, addKeyedListener, onDispatchAction, onOptionsChange]);
  var scheduleContext = React.useMemo(function () {
    return {
      scheduleUpdate: scheduleUpdate,
      flushUpdates: flushUpdates
    };
  }, [scheduleUpdate, flushUpdates]);
  var isInitialRef = React.useRef(true);
  var getIsInitial = React.useCallback(function () {
    return isInitialRef.current;
  }, []);
  var context = React.useMemo(function () {
    return {
      state: state,
      getState: getState,
      setState: setState,
      getKey: getKey,
      setKey: setKey,
      getIsInitial: getIsInitial,
      addOptionsGetter: addOptionsGetter
    };
  }, [state, getState, setState, getKey, setKey, getIsInitial, addOptionsGetter]);
  var onStateChangeRef = React.useRef(onStateChange);
  var stateRef = React.useRef(state);
  React.useEffect(function () {
    isInitialRef.current = false;
    onStateChangeRef.current = onStateChange;
    stateRef.current = state;
  });
  React.useEffect(function () {
    var hydratedState = getRootState();
    if (process.env.NODE_ENV !== 'production') {
      if (hydratedState !== undefined) {
        var serializableResult = (0, _checkSerializable.default)(hydratedState);
        if (!serializableResult.serializable) {
          var location = serializableResult.location,
            reason = serializableResult.reason;
          var path = '';
          var pointer = hydratedState;
          var params = false;
          for (var i = 0; i < location.length; i++) {
            var curr = location[i];
            var prev = location[i - 1];
            pointer = pointer[curr];
            if (!params && curr === 'state') {
              continue;
            } else if (!params && curr === 'routes') {
              if (path) {
                path += ' > ';
              }
            } else if (!params && typeof curr === 'number' && prev === 'routes') {
              var _pointer;
              path += (_pointer = pointer) == null ? void 0 : _pointer.name;
            } else if (!params) {
              path += ` > ${curr}`;
              params = true;
            } else {
              if (typeof curr === 'number' || /^[0-9]+$/.test(curr)) {
                path += `[${curr}]`;
              } else if (/^[a-z$_]+$/i.test(curr)) {
                path += `.${curr}`;
              } else {
                path += `[${JSON.stringify(curr)}]`;
              }
            }
          }
          var message = `Non-serializable values were found in the navigation state. Check:\n\n${path} (${reason})\n\nThis can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details.`;
          if (!serializableWarnings.includes(message)) {
            serializableWarnings.push(message);
            console.warn(message);
          }
        }
        var duplicateRouteNamesResult = (0, _checkDuplicateRouteNames.default)(hydratedState);
        if (duplicateRouteNamesResult.length) {
          var _message = `Found screens with the same name nested inside one another. Check:\n${duplicateRouteNamesResult.map(function (locations) {
            return `\n${locations.join(', ')}`;
          })}\n\nThis can cause confusing behavior during navigation. Consider using unique names for each screen instead.`;
          if (!duplicateNameWarnings.includes(_message)) {
            duplicateNameWarnings.push(_message);
            console.warn(_message);
          }
        }
      }
    }
    emitter.emit({
      type: 'state',
      data: {
        state: state
      }
    });
    if (!isFirstMountRef.current && onStateChangeRef.current) {
      onStateChangeRef.current(hydratedState);
    }
    isFirstMountRef.current = false;
  }, [getRootState, emitter, state]);
  var defaultOnUnhandledAction = React.useCallback(function (action) {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    var payload = action.payload;
    var message = `The action '${action.type}'${payload ? ` with payload ${JSON.stringify(action.payload)}` : ''} was not handled by any navigator.`;
    switch (action.type) {
      case 'NAVIGATE':
      case 'PUSH':
      case 'REPLACE':
      case 'JUMP_TO':
        if (payload != null && payload.name) {
          message += `\n\nDo you have a screen named '${payload.name}'?\n\nIf you're trying to navigate to a screen in a nested navigator, see https://reactnavigation.org/docs/nesting-navigators#navigating-to-a-screen-in-a-nested-navigator.`;
        } else {
          message += `\n\nYou need to pass the name of the screen to navigate to.\n\nSee https://reactnavigation.org/docs/navigation-actions for usage.`;
        }
        break;
      case 'GO_BACK':
      case 'POP':
      case 'POP_TO_TOP':
        message += `\n\nIs there any screen to go back to?`;
        break;
      case 'OPEN_DRAWER':
      case 'CLOSE_DRAWER':
      case 'TOGGLE_DRAWER':
        message += `\n\nIs your screen inside a Drawer navigator?`;
        break;
    }
    message += `\n\nThis is a development-only warning and won't be shown in production.`;
    console.error(message);
  }, []);
  var element = (0, _jsxRuntime.jsx)(_NavigationContainerRefContext.default.Provider, {
    value: navigation,
    children: (0, _jsxRuntime.jsx)(_useScheduleUpdate.ScheduleUpdateContext.Provider, {
      value: scheduleContext,
      children: (0, _jsxRuntime.jsx)(_NavigationBuilderContext.default.Provider, {
        value: builderContext,
        children: (0, _jsxRuntime.jsx)(_NavigationStateContext.default.Provider, {
          value: context,
          children: (0, _jsxRuntime.jsx)(_UnhandledActionContext.default.Provider, {
            value: onUnhandledAction != null ? onUnhandledAction : defaultOnUnhandledAction,
            children: (0, _jsxRuntime.jsx)(_EnsureSingleNavigator.default, {
              children: children
            })
          })
        })
      })
    })
  });
  if (independent) {
    element = (0, _jsxRuntime.jsx)(_NavigationRouteContext.default.Provider, {
      value: undefined,
      children: (0, _jsxRuntime.jsx)(_NavigationContext.default.Provider, {
        value: undefined,
        children: element
      })
    });
  }
  return element;
});
var _default = BaseNavigationContainer;
exports["default"] = _default;

/***/ }),

/***/ 7834:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var CurrentRenderContext = React.createContext(undefined);
var _default = CurrentRenderContext;
exports["default"] = _default;

/***/ }),

/***/ 3328:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.SingleNavigatorContext = void 0;
exports["default"] = EnsureSingleNavigator;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _jsxRuntime = __nccwpck_require__(8872);
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var MULTIPLE_NAVIGATOR_ERROR = `Another navigator is already registered for this container. You likely have multiple navigators under a single "NavigationContainer" or "Screen". Make sure each navigator is under a separate "Screen" container. See https://reactnavigation.org/docs/nesting-navigators for a guide on nesting.`;
var SingleNavigatorContext = React.createContext(undefined);
exports.SingleNavigatorContext = SingleNavigatorContext;
function EnsureSingleNavigator(_ref) {
  var children = _ref.children;
  var navigatorKeyRef = React.useRef();
  var value = React.useMemo(function () {
    return {
      register: function register(key) {
        var currentKey = navigatorKeyRef.current;
        if (currentKey !== undefined && key !== currentKey) {
          throw new Error(MULTIPLE_NAVIGATOR_ERROR);
        }
        navigatorKeyRef.current = key;
      },
      unregister: function unregister(key) {
        var currentKey = navigatorKeyRef.current;
        if (key !== currentKey) {
          return;
        }
        navigatorKeyRef.current = undefined;
      }
    };
  }, []);
  return (0, _jsxRuntime.jsx)(SingleNavigatorContext.Provider, {
    value: value,
    children: children
  });
}

/***/ }),

/***/ 1978:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = Group;
function Group(_) {
  return null;
}

/***/ }),

/***/ 4421:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var NavigationBuilderContext = React.createContext({
  onDispatchAction: function onDispatchAction() {
    return undefined;
  },
  onOptionsChange: function onOptionsChange() {
    return undefined;
  }
});
var _default = NavigationBuilderContext;
exports["default"] = _default;

/***/ }),

/***/ 4952:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var NavigationContainerRefContext = React.createContext(undefined);
var _default = NavigationContainerRefContext;
exports["default"] = _default;

/***/ }),

/***/ 1298:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var NavigationContext = React.createContext(undefined);
var _default = NavigationContext;
exports["default"] = _default;

/***/ }),

/***/ 6482:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var NavigationHelpersContext = React.createContext(undefined);
var _default = NavigationHelpersContext;
exports["default"] = _default;

/***/ }),

/***/ 7839:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var NavigationRouteContext = React.createContext(undefined);
var _default = NavigationRouteContext;
exports["default"] = _default;

/***/ }),

/***/ 4492:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var MISSING_CONTEXT_ERROR = "Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'? See https://reactnavigation.org/docs/getting-started for setup instructions.";
var _default = React.createContext({
  isDefault: true,
  get getKey() {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  get setKey() {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  get getState() {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  get setState() {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  get getIsInitial() {
    throw new Error(MISSING_CONTEXT_ERROR);
  }
});
exports["default"] = _default;

/***/ }),

/***/ 4478:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var PreventRemoveContext = React.createContext(undefined);
var _default = PreventRemoveContext;
exports["default"] = _default;

/***/ }),

/***/ 1633:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = PreventRemoveProvider;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var _toConsumableArray2 = _interopRequireDefault(__nccwpck_require__(4767));
var _nonSecure = __nccwpck_require__(7883);
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _useLatestCallback = _interopRequireDefault(__nccwpck_require__(5478));
var _NavigationHelpersContext = _interopRequireDefault(__nccwpck_require__(6482));
var _NavigationRouteContext = _interopRequireDefault(__nccwpck_require__(7839));
var _PreventRemoveContext = _interopRequireDefault(__nccwpck_require__(4478));
var _jsxRuntime = __nccwpck_require__(8872);
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var transformPreventedRoutes = function transformPreventedRoutes(preventedRoutesMap) {
  var preventedRoutesToTransform = (0, _toConsumableArray2.default)(preventedRoutesMap.values());
  var preventedRoutes = preventedRoutesToTransform.reduce(function (acc, _ref) {
    var _acc$routeKey;
    var routeKey = _ref.routeKey,
      preventRemove = _ref.preventRemove;
    acc[routeKey] = {
      preventRemove: ((_acc$routeKey = acc[routeKey]) == null ? void 0 : _acc$routeKey.preventRemove) || preventRemove
    };
    return acc;
  }, {});
  return preventedRoutes;
};
function PreventRemoveProvider(_ref2) {
  var children = _ref2.children;
  var _React$useState = React.useState(function () {
      return (0, _nonSecure.nanoid)();
    }),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 1),
    parentId = _React$useState2[0];
  var _React$useState3 = React.useState(new Map()),
    _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
    preventedRoutesMap = _React$useState4[0],
    setPreventedRoutesMap = _React$useState4[1];
  var navigation = React.useContext(_NavigationHelpersContext.default);
  var route = React.useContext(_NavigationRouteContext.default);
  var preventRemoveContextValue = React.useContext(_PreventRemoveContext.default);
  var setParentPrevented = preventRemoveContextValue == null ? void 0 : preventRemoveContextValue.setPreventRemove;
  var setPreventRemove = (0, _useLatestCallback.default)(function (id, routeKey, preventRemove) {
    if (preventRemove && (navigation == null || navigation != null && navigation.getState().routes.every(function (route) {
      return route.key !== routeKey;
    }))) {
      throw new Error(`Couldn't find a route with the key ${routeKey}. Is your component inside NavigationContent?`);
    }
    setPreventedRoutesMap(function (prevPrevented) {
      var _prevPrevented$get, _prevPrevented$get2;
      if (routeKey === ((_prevPrevented$get = prevPrevented.get(id)) == null ? void 0 : _prevPrevented$get.routeKey) && preventRemove === ((_prevPrevented$get2 = prevPrevented.get(id)) == null ? void 0 : _prevPrevented$get2.preventRemove)) {
        return prevPrevented;
      }
      var nextPrevented = new Map(prevPrevented);
      if (preventRemove) {
        nextPrevented.set(id, {
          routeKey: routeKey,
          preventRemove: preventRemove
        });
      } else {
        nextPrevented.delete(id);
      }
      return nextPrevented;
    });
  });
  var isPrevented = (0, _toConsumableArray2.default)(preventedRoutesMap.values()).some(function (_ref3) {
    var preventRemove = _ref3.preventRemove;
    return preventRemove;
  });
  React.useEffect(function () {
    if ((route == null ? void 0 : route.key) !== undefined && setParentPrevented !== undefined) {
      setParentPrevented(parentId, route.key, isPrevented);
      return function () {
        setParentPrevented(parentId, route.key, false);
      };
    }
    return;
  }, [parentId, isPrevented, route == null ? void 0 : route.key, setParentPrevented]);
  var value = React.useMemo(function () {
    return {
      setPreventRemove: setPreventRemove,
      preventedRoutes: transformPreventedRoutes(preventedRoutesMap)
    };
  }, [setPreventRemove, preventedRoutesMap]);
  return (0, _jsxRuntime.jsx)(_PreventRemoveContext.default.Provider, {
    value: value,
    children: children
  });
}

/***/ }),

/***/ 9037:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = SceneView;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _EnsureSingleNavigator = _interopRequireDefault(__nccwpck_require__(3328));
var _NavigationStateContext = _interopRequireDefault(__nccwpck_require__(4492));
var _StaticContainer = _interopRequireDefault(__nccwpck_require__(5764));
var _useOptionsGetters2 = _interopRequireDefault(__nccwpck_require__(9660));
var _jsxRuntime = __nccwpck_require__(8872);
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function SceneView(_ref) {
  var screen = _ref.screen,
    route = _ref.route,
    navigation = _ref.navigation,
    routeState = _ref.routeState,
    getState = _ref.getState,
    setState = _ref.setState,
    options = _ref.options,
    clearOptions = _ref.clearOptions;
  var navigatorKeyRef = React.useRef();
  var getKey = React.useCallback(function () {
    return navigatorKeyRef.current;
  }, []);
  var _useOptionsGetters = (0, _useOptionsGetters2.default)({
      key: route.key,
      options: options,
      navigation: navigation
    }),
    addOptionsGetter = _useOptionsGetters.addOptionsGetter;
  var setKey = React.useCallback(function (key) {
    navigatorKeyRef.current = key;
  }, []);
  var getCurrentState = React.useCallback(function () {
    var state = getState();
    var currentRoute = state.routes.find(function (r) {
      return r.key === route.key;
    });
    return currentRoute ? currentRoute.state : undefined;
  }, [getState, route.key]);
  var setCurrentState = React.useCallback(function (child) {
    var state = getState();
    setState(Object.assign({}, state, {
      routes: state.routes.map(function (r) {
        return r.key === route.key ? Object.assign({}, r, {
          state: child
        }) : r;
      })
    }));
  }, [getState, route.key, setState]);
  var isInitialRef = React.useRef(true);
  React.useEffect(function () {
    isInitialRef.current = false;
  });
  React.useEffect(function () {
    return clearOptions;
  }, []);
  var getIsInitial = React.useCallback(function () {
    return isInitialRef.current;
  }, []);
  var context = React.useMemo(function () {
    return {
      state: routeState,
      getState: getCurrentState,
      setState: setCurrentState,
      getKey: getKey,
      setKey: setKey,
      getIsInitial: getIsInitial,
      addOptionsGetter: addOptionsGetter
    };
  }, [routeState, getCurrentState, setCurrentState, getKey, setKey, getIsInitial, addOptionsGetter]);
  var ScreenComponent = screen.getComponent ? screen.getComponent() : screen.component;
  return (0, _jsxRuntime.jsx)(_NavigationStateContext.default.Provider, {
    value: context,
    children: (0, _jsxRuntime.jsx)(_EnsureSingleNavigator.default, {
      children: (0, _jsxRuntime.jsx)(_StaticContainer.default, {
        name: screen.name,
        render: ScreenComponent || screen.children,
        navigation: navigation,
        route: route,
        children: ScreenComponent !== undefined ? (0, _jsxRuntime.jsx)(ScreenComponent, {
          navigation: navigation,
          route: route
        }) : screen.children !== undefined ? screen.children({
          navigation: navigation,
          route: route
        }) : null
      })
    })
  });
}

/***/ }),

/***/ 5658:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = Screen;
function Screen(_) {
  return null;
}

/***/ }),

/***/ 5764:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function StaticContainer(props) {
  return props.children;
}
var _default = React.memo(StaticContainer, function (prevProps, nextProps) {
  var prevPropKeys = Object.keys(prevProps);
  var nextPropKeys = Object.keys(nextProps);
  if (prevPropKeys.length !== nextPropKeys.length) {
    return false;
  }
  for (var key of prevPropKeys) {
    if (key === 'children') {
      continue;
    }
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  return true;
});
exports["default"] = _default;

/***/ }),

/***/ 1830:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var UnhandledActionContext = React.createContext(undefined);
var _default = UnhandledActionContext;
exports["default"] = _default;

/***/ }),

/***/ 5143:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = checkDuplicateRouteNames;
function checkDuplicateRouteNames(state) {
  var duplicates = [];
  var getRouteNames = function getRouteNames(location, state) {
    state.routes.forEach(function (route) {
      var _route$state, _route$state$routeNam;
      var currentLocation = location ? `${location} > ${route.name}` : route.name;
      (_route$state = route.state) == null ? void 0 : (_route$state$routeNam = _route$state.routeNames) == null ? void 0 : _route$state$routeNam.forEach(function (routeName) {
        if (routeName === route.name) {
          duplicates.push([currentLocation, `${currentLocation} > ${route.name}`]);
        }
      });
      if (route.state) {
        getRouteNames(currentLocation, route.state);
      }
    });
  };
  getRouteNames('', state);
  return duplicates;
}

/***/ }),

/***/ 7623:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = checkSerializable;
var _toConsumableArray2 = _interopRequireDefault(__nccwpck_require__(4767));
var checkSerializableWithoutCircularReference = function checkSerializableWithoutCircularReference(o, seen, location) {
  if (o === undefined || o === null || typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
    return {
      serializable: true
    };
  }
  if (Object.prototype.toString.call(o) !== '[object Object]' && !Array.isArray(o)) {
    return {
      serializable: false,
      location: location,
      reason: typeof o === 'function' ? 'Function' : String(o)
    };
  }
  if (seen.has(o)) {
    return {
      serializable: false,
      reason: 'Circular reference',
      location: location
    };
  }
  seen.add(o);
  if (Array.isArray(o)) {
    for (var i = 0; i < o.length; i++) {
      var childResult = checkSerializableWithoutCircularReference(o[i], new Set(seen), [].concat((0, _toConsumableArray2.default)(location), [i]));
      if (!childResult.serializable) {
        return childResult;
      }
    }
  } else {
    for (var _key in o) {
      var _childResult = checkSerializableWithoutCircularReference(o[_key], new Set(seen), [].concat((0, _toConsumableArray2.default)(location), [_key]));
      if (!_childResult.serializable) {
        return _childResult;
      }
    }
  }
  return {
    serializable: true
  };
};
function checkSerializable(o) {
  return checkSerializableWithoutCircularReference(o, new Set(), []);
}

/***/ }),

/***/ 6106:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.NOT_INITIALIZED_ERROR = void 0;
exports["default"] = createNavigationContainerRef;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var _toConsumableArray2 = _interopRequireDefault(__nccwpck_require__(4767));
var _routers = __nccwpck_require__(6844);
var NOT_INITIALIZED_ERROR = "The 'navigation' object hasn't been initialized yet. This might happen if you don't have a navigator mounted, or if the navigator hasn't finished mounting. See https://reactnavigation.org/docs/navigating-without-navigation-prop#handling-initialization for more details.";
exports.NOT_INITIALIZED_ERROR = NOT_INITIALIZED_ERROR;
function createNavigationContainerRef() {
  var methods = [].concat((0, _toConsumableArray2.default)(Object.keys(_routers.CommonActions)), ['addListener', 'removeListener', 'resetRoot', 'dispatch', 'isFocused', 'canGoBack', 'getRootState', 'getState', 'getParent', 'getCurrentRoute', 'getCurrentOptions']);
  var listeners = {};
  var removeListener = function removeListener(event, callback) {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(function (cb) {
        return cb !== callback;
      });
    }
  };
  var current = null;
  var ref = Object.assign({
    get current() {
      return current;
    },
    set current(value) {
      current = value;
      if (value != null) {
        Object.entries(listeners).forEach(function (_ref) {
          var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
            event = _ref2[0],
            callbacks = _ref2[1];
          callbacks.forEach(function (callback) {
            value.addListener(event, callback);
          });
        });
      }
    },
    isReady: function isReady() {
      if (current == null) {
        return false;
      }
      return current.isReady();
    }
  }, methods.reduce(function (acc, name) {
    acc[name] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      if (current == null) {
        switch (name) {
          case 'addListener':
            {
              var event = args[0],
                callback = args[1];
              listeners[event] = listeners[event] || [];
              listeners[event].push(callback);
              return function () {
                return removeListener(event, callback);
              };
            }
          case 'removeListener':
            {
              var _event = args[0],
                _callback = args[1];
              removeListener(_event, _callback);
              break;
            }
          default:
            console.error(NOT_INITIALIZED_ERROR);
        }
      } else {
        var _current;
        return (_current = current)[name].apply(_current, args);
      }
    };
    return acc;
  }, {}));
  return ref;
}

/***/ }),

/***/ 5886:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = createNavigatorFactory;
var _Group = _interopRequireDefault(__nccwpck_require__(1978));
var _Screen = _interopRequireDefault(__nccwpck_require__(5658));
function createNavigatorFactory(Navigator) {
  return function () {
    if (arguments[0] !== undefined) {
      throw new Error("Creating a navigator doesn't take an argument. Maybe you are trying to use React Navigation 4 API? See https://reactnavigation.org/docs/hello-react-navigation for the latest API and guides.");
    }
    return {
      Navigator: Navigator,
      Group: _Group.default,
      Screen: _Screen.default
    };
  };
}

/***/ }),

/***/ 390:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = findFocusedRoute;
function findFocusedRoute(state) {
  var _current2, _current$index3, _current3;
  var current = state;
  while (((_current = current) == null ? void 0 : _current.routes[(_current$index = current.index) != null ? _current$index : 0].state) != null) {
    var _current, _current$index, _current$index2;
    current = current.routes[(_current$index2 = current.index) != null ? _current$index2 : 0].state;
  }
  var route = (_current2 = current) == null ? void 0 : _current2.routes[(_current$index3 = (_current3 = current) == null ? void 0 : _current3.index) != null ? _current$index3 : 0];
  return route;
}

/***/ }),

/***/ 8202:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = fromEntries;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
function fromEntries(entries) {
  return entries.reduce(function (acc, _ref) {
    var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
      k = _ref2[0],
      v = _ref2[1];
    if (acc.hasOwnProperty(k)) {
      throw new Error(`A value for key '${k}' already exists in the object.`);
    }
    acc[k] = v;
    return acc;
  }, {});
}

/***/ }),

/***/ 7018:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = getActionFromState;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
function getActionFromState(state, options) {
  var _state$index, _normalizedConfig$scr;
  var normalizedConfig = options ? createNormalizedConfigItem(options) : {};
  var routes = state.index != null ? state.routes.slice(0, state.index + 1) : state.routes;
  if (routes.length === 0) {
    return undefined;
  }
  if (!(routes.length === 1 && routes[0].key === undefined || routes.length === 2 && routes[0].key === undefined && routes[0].name === (normalizedConfig == null ? void 0 : normalizedConfig.initialRouteName) && routes[1].key === undefined)) {
    return {
      type: 'RESET',
      payload: state
    };
  }
  var route = state.routes[(_state$index = state.index) != null ? _state$index : state.routes.length - 1];
  var current = route == null ? void 0 : route.state;
  var config = normalizedConfig == null ? void 0 : (_normalizedConfig$scr = normalizedConfig.screens) == null ? void 0 : _normalizedConfig$scr[route == null ? void 0 : route.name];
  var params = Object.assign({}, route.params);
  var payload = route ? {
    name: route.name,
    path: route.path,
    params: params
  } : undefined;
  while (current) {
    var _config, _config2, _config2$screens;
    if (current.routes.length === 0) {
      return undefined;
    }
    var _routes = current.index != null ? current.routes.slice(0, current.index + 1) : current.routes;
    var _route = _routes[_routes.length - 1];
    Object.assign(params, {
      initial: undefined,
      screen: undefined,
      params: undefined,
      state: undefined
    });
    if (_routes.length === 1 && _routes[0].key === undefined) {
      params.initial = true;
      params.screen = _route.name;
    } else if (_routes.length === 2 && _routes[0].key === undefined && _routes[0].name === ((_config = config) == null ? void 0 : _config.initialRouteName) && _routes[1].key === undefined) {
      params.initial = false;
      params.screen = _route.name;
    } else {
      params.state = current;
      break;
    }
    if (_route.state) {
      params.params = Object.assign({}, _route.params);
      params = params.params;
    } else {
      params.path = _route.path;
      params.params = _route.params;
    }
    current = _route.state;
    config = (_config2 = config) == null ? void 0 : (_config2$screens = _config2.screens) == null ? void 0 : _config2$screens[_route.name];
  }
  if (!payload) {
    return;
  }
  return {
    type: 'NAVIGATE',
    payload: payload
  };
}
var createNormalizedConfigItem = function createNormalizedConfigItem(config) {
  return typeof config === 'object' && config != null ? {
    initialRouteName: config.initialRouteName,
    screens: config.screens != null ? createNormalizedConfigs(config.screens) : undefined
  } : {};
};
var createNormalizedConfigs = function createNormalizedConfigs(options) {
  return Object.entries(options).reduce(function (acc, _ref) {
    var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
      k = _ref2[0],
      v = _ref2[1];
    acc[k] = createNormalizedConfigItem(v);
    return acc;
  }, {});
};

/***/ }),

/***/ 9546:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = getFocusedRouteNameFromRoute;
var _useRouteCache = __nccwpck_require__(4903);
function getFocusedRouteNameFromRoute(route) {
  var _route$CHILD_STATE, _state$index;
  var state = (_route$CHILD_STATE = route[_useRouteCache.CHILD_STATE]) != null ? _route$CHILD_STATE : route.state;
  var params = route.params;
  var routeName = state ? state.routes[(_state$index = state.index) != null ? _state$index : typeof state.type === 'string' && state.type !== 'stack' ? 0 : state.routes.length - 1].name : typeof (params == null ? void 0 : params.screen) === 'string' ? params.screen : undefined;
  return routeName;
}

/***/ }),

/***/ 4025:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = getPathFromState;
var _toConsumableArray2 = _interopRequireDefault(__nccwpck_require__(4767));
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var queryString = _interopRequireWildcard(__nccwpck_require__(1804));
var _fromEntries = _interopRequireDefault(__nccwpck_require__(8202));
var _validatePathConfig = _interopRequireDefault(__nccwpck_require__(3688));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var getActiveRoute = function getActiveRoute(state) {
  var route = typeof state.index === 'number' ? state.routes[state.index] : state.routes[state.routes.length - 1];
  if (route.state) {
    return getActiveRoute(route.state);
  }
  return route;
};
function getPathFromState(state, options) {
  if (state == null) {
    throw Error("Got 'undefined' for the navigation state. You must pass a valid state object.");
  }
  if (options) {
    (0, _validatePathConfig.default)(options);
  }
  var configs = options != null && options.screens ? createNormalizedConfigs(options == null ? void 0 : options.screens) : {};
  var path = '/';
  var current = state;
  var allParams = {};
  var _loop = function _loop() {
    var index = typeof current.index === 'number' ? current.index : 0;
    var route = current.routes[index];
    var pattern;
    var focusedParams;
    var focusedRoute = getActiveRoute(state);
    var currentOptions = configs;
    var nestedRouteNames = [];
    var hasNext = true;
    var _loop2 = function _loop2() {
      pattern = currentOptions[route.name].pattern;
      nestedRouteNames.push(route.name);
      if (route.params) {
        var _currentOptions$route;
        var stringify = (_currentOptions$route = currentOptions[route.name]) == null ? void 0 : _currentOptions$route.stringify;
        var currentParams = (0, _fromEntries.default)(Object.entries(route.params).map(function (_ref) {
          var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
            key = _ref2[0],
            value = _ref2[1];
          return [key, stringify != null && stringify[key] ? stringify[key](value) : String(value)];
        }));
        if (pattern) {
          Object.assign(allParams, currentParams);
        }
        if (focusedRoute === route) {
          var _pattern;
          focusedParams = Object.assign({}, currentParams);
          (_pattern = pattern) == null ? void 0 : _pattern.split('/').filter(function (p) {
            return p.startsWith(':');
          }).forEach(function (p) {
            var name = getParamName(p);
            if (focusedParams) {
              delete focusedParams[name];
            }
          });
        }
      }
      if (!currentOptions[route.name].screens || route.state === undefined) {
        hasNext = false;
      } else {
        index = typeof route.state.index === 'number' ? route.state.index : route.state.routes.length - 1;
        var nextRoute = route.state.routes[index];
        var nestedConfig = currentOptions[route.name].screens;
        if (nestedConfig && nextRoute.name in nestedConfig) {
          route = nextRoute;
          currentOptions = nestedConfig;
        } else {
          hasNext = false;
        }
      }
    };
    while (route.name in currentOptions && hasNext) {
      _loop2();
    }
    if (pattern === undefined) {
      pattern = nestedRouteNames.join('/');
    }
    if (currentOptions[route.name] !== undefined) {
      path += pattern.split('/').map(function (p) {
        var name = getParamName(p);
        if (p === '*') {
          return route.name;
        }
        if (p.startsWith(':')) {
          var _value = allParams[name];
          if (_value === undefined && p.endsWith('?')) {
            return '';
          }
          return encodeURIComponent(_value);
        }
        return encodeURIComponent(p);
      }).join('/');
    } else {
      path += encodeURIComponent(route.name);
    }
    if (!focusedParams) {
      focusedParams = focusedRoute.params;
    }
    if (route.state) {
      path += '/';
    } else if (focusedParams) {
      for (var param in focusedParams) {
        if (focusedParams[param] === 'undefined') {
          delete focusedParams[param];
        }
      }
      var query = queryString.stringify(focusedParams, {
        sort: false
      });
      if (query) {
        path += `?${query}`;
      }
    }
    current = route.state;
  };
  while (current) {
    _loop();
  }
  path = path.replace(/\/+/g, '/');
  path = path.length > 1 ? path.replace(/\/$/, '') : path;
  return path;
}
var getParamName = function getParamName(pattern) {
  return pattern.replace(/^:/, '').replace(/\?$/, '');
};
var joinPaths = function joinPaths() {
  var _ref3;
  for (var _len = arguments.length, paths = new Array(_len), _key = 0; _key < _len; _key++) {
    paths[_key] = arguments[_key];
  }
  return (_ref3 = []).concat.apply(_ref3, (0, _toConsumableArray2.default)(paths.map(function (p) {
    return p.split('/');
  }))).filter(Boolean).join('/');
};
var createConfigItem = function createConfigItem(config, parentPattern) {
  var _pattern3;
  if (typeof config === 'string') {
    var _pattern2 = parentPattern ? joinPaths(parentPattern, config) : config;
    return {
      pattern: _pattern2
    };
  }
  var pattern;
  if (config.exact && config.path === undefined) {
    throw new Error("A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`.");
  }
  pattern = config.exact !== true ? joinPaths(parentPattern || '', config.path || '') : config.path || '';
  var screens = config.screens ? createNormalizedConfigs(config.screens, pattern) : undefined;
  return {
    pattern: (_pattern3 = pattern) == null ? void 0 : _pattern3.split('/').filter(Boolean).join('/'),
    stringify: config.stringify,
    screens: screens
  };
};
var createNormalizedConfigs = function createNormalizedConfigs(options, pattern) {
  return (0, _fromEntries.default)(Object.entries(options).map(function (_ref4) {
    var _ref5 = (0, _slicedToArray2.default)(_ref4, 2),
      name = _ref5[0],
      c = _ref5[1];
    var result = createConfigItem(c, pattern);
    return [name, result];
  }));
};

/***/ }),

/***/ 2231:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = getStateFromPath;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(9148));
var _toConsumableArray2 = _interopRequireDefault(__nccwpck_require__(4767));
var _escapeStringRegexp = _interopRequireDefault(__nccwpck_require__(6430));
var queryString = _interopRequireWildcard(__nccwpck_require__(1804));
var _findFocusedRoute = _interopRequireDefault(__nccwpck_require__(390));
var _validatePathConfig = _interopRequireDefault(__nccwpck_require__(3688));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function getStateFromPath(path, options) {
  var _ref;
  if (options) {
    (0, _validatePathConfig.default)(options);
  }
  var initialRoutes = [];
  if (options != null && options.initialRouteName) {
    initialRoutes.push({
      initialRouteName: options.initialRouteName,
      parentScreens: []
    });
  }
  var screens = options == null ? void 0 : options.screens;
  var remaining = path.replace(/\/+/g, '/').replace(/^\//, '').replace(/\?.*$/, '');
  remaining = remaining.endsWith('/') ? remaining : `${remaining}/`;
  if (screens === undefined) {
    var _routes = remaining.split('/').filter(Boolean).map(function (segment) {
      var name = decodeURIComponent(segment);
      return {
        name: name
      };
    });
    if (_routes.length) {
      return createNestedStateObject(path, _routes, initialRoutes);
    }
    return undefined;
  }
  var configs = (_ref = []).concat.apply(_ref, (0, _toConsumableArray2.default)(Object.keys(screens).map(function (key) {
    return createNormalizedConfigs(key, screens, [], initialRoutes, []);
  }))).sort(function (a, b) {
    if (a.pattern === b.pattern) {
      return b.routeNames.join('>').localeCompare(a.routeNames.join('>'));
    }
    if (a.pattern.startsWith(b.pattern)) {
      return -1;
    }
    if (b.pattern.startsWith(a.pattern)) {
      return 1;
    }
    var aParts = a.pattern.split('/');
    var bParts = b.pattern.split('/');
    for (var i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if (aParts[i] == null) {
        return 1;
      }
      if (bParts[i] == null) {
        return -1;
      }
      var aWildCard = aParts[i] === '*' || aParts[i].startsWith(':');
      var bWildCard = bParts[i] === '*' || bParts[i].startsWith(':');
      if (aWildCard && bWildCard) {
        continue;
      }
      if (aWildCard) {
        return 1;
      }
      if (bWildCard) {
        return -1;
      }
    }
    return bParts.length - aParts.length;
  });
  configs.reduce(function (acc, config) {
    if (acc[config.pattern]) {
      var a = acc[config.pattern].routeNames;
      var b = config.routeNames;
      var intersects = a.length > b.length ? b.every(function (it, i) {
        return a[i] === it;
      }) : a.every(function (it, i) {
        return b[i] === it;
      });
      if (!intersects) {
        throw new Error(`Found conflicting screens with the same pattern. The pattern '${config.pattern}' resolves to both '${a.join(' > ')}' and '${b.join(' > ')}'. Patterns must be unique and cannot resolve to more than one screen.`);
      }
    }
    return Object.assign(acc, (0, _defineProperty2.default)({}, config.pattern, config));
  }, {});
  if (remaining === '/') {
    var match = configs.find(function (config) {
      return config.path === '' && config.routeNames.every(function (name) {
        var _configs$find;
        return !((_configs$find = configs.find(function (c) {
          return c.screen === name;
        })) != null && _configs$find.path);
      });
    });
    if (match) {
      return createNestedStateObject(path, match.routeNames.map(function (name) {
        return {
          name: name
        };
      }), initialRoutes, configs);
    }
    return undefined;
  }
  var result;
  var current;
  var _matchAgainstConfigs = matchAgainstConfigs(remaining, configs.map(function (c) {
      return Object.assign({}, c, {
        regex: c.regex ? new RegExp(c.regex.source + '$') : undefined
      });
    })),
    routes = _matchAgainstConfigs.routes,
    remainingPath = _matchAgainstConfigs.remainingPath;
  if (routes !== undefined) {
    current = createNestedStateObject(path, routes, initialRoutes, configs);
    remaining = remainingPath;
    result = current;
  }
  if (current == null || result == null) {
    return undefined;
  }
  return result;
}
var joinPaths = function joinPaths() {
  var _ref2;
  for (var _len = arguments.length, paths = new Array(_len), _key = 0; _key < _len; _key++) {
    paths[_key] = arguments[_key];
  }
  return (_ref2 = []).concat.apply(_ref2, (0, _toConsumableArray2.default)(paths.map(function (p) {
    return p.split('/');
  }))).filter(Boolean).join('/');
};
var matchAgainstConfigs = function matchAgainstConfigs(remaining, configs) {
  var routes;
  var remainingPath = remaining;
  var _loop = function _loop() {
    if (!config.regex) {
      return "continue";
    }
    var match = remainingPath.match(config.regex);
    if (match) {
      var _config$pattern;
      var matchedParams = (_config$pattern = config.pattern) == null ? void 0 : _config$pattern.split('/').filter(function (p) {
        return p.startsWith(':');
      }).reduce(function (acc, p, i) {
        return Object.assign(acc, (0, _defineProperty2.default)({}, p, match[(i + 1) * 2].replace(/\//, '')));
      }, {});
      routes = config.routeNames.map(function (name) {
        var _config$path;
        var config = configs.find(function (c) {
          return c.screen === name;
        });
        var params = config == null ? void 0 : (_config$path = config.path) == null ? void 0 : _config$path.split('/').filter(function (p) {
          return p.startsWith(':');
        }).reduce(function (acc, p) {
          var value = matchedParams[p];
          if (value) {
            var _config$parse;
            var key = p.replace(/^:/, '').replace(/\?$/, '');
            acc[key] = (_config$parse = config.parse) != null && _config$parse[key] ? config.parse[key](value) : value;
          }
          return acc;
        }, {});
        if (params && Object.keys(params).length) {
          return {
            name: name,
            params: params
          };
        }
        return {
          name: name
        };
      });
      remainingPath = remainingPath.replace(match[1], '');
      return "break";
    }
  };
  for (var config of configs) {
    var _ret = _loop();
    if (_ret === "continue") continue;
    if (_ret === "break") break;
  }
  return {
    routes: routes,
    remainingPath: remainingPath
  };
};
var createNormalizedConfigs = function createNormalizedConfigs(screen, routeConfig) {
  var routeNames = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var initials = arguments.length > 3 ? arguments[3] : undefined;
  var parentScreens = arguments.length > 4 ? arguments[4] : undefined;
  var parentPattern = arguments.length > 5 ? arguments[5] : undefined;
  var configs = [];
  routeNames.push(screen);
  parentScreens.push(screen);
  var config = routeConfig[screen];
  if (typeof config === 'string') {
    var pattern = parentPattern ? joinPaths(parentPattern, config) : config;
    configs.push(createConfigItem(screen, routeNames, pattern, config));
  } else if (typeof config === 'object') {
    var _pattern;
    if (typeof config.path === 'string') {
      if (config.exact && config.path === undefined) {
        throw new Error("A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`.");
      }
      _pattern = config.exact !== true ? joinPaths(parentPattern || '', config.path || '') : config.path || '';
      configs.push(createConfigItem(screen, routeNames, _pattern, config.path, config.parse));
    }
    if (config.screens) {
      if (config.initialRouteName) {
        initials.push({
          initialRouteName: config.initialRouteName,
          parentScreens: parentScreens
        });
      }
      Object.keys(config.screens).forEach(function (nestedConfig) {
        var _pattern2;
        var result = createNormalizedConfigs(nestedConfig, config.screens, routeNames, initials, (0, _toConsumableArray2.default)(parentScreens), (_pattern2 = _pattern) != null ? _pattern2 : parentPattern);
        configs.push.apply(configs, (0, _toConsumableArray2.default)(result));
      });
    }
  }
  routeNames.pop();
  return configs;
};
var createConfigItem = function createConfigItem(screen, routeNames, pattern, path, parse) {
  pattern = pattern.split('/').filter(Boolean).join('/');
  var regex = pattern ? new RegExp(`^(${pattern.split('/').map(function (it) {
    if (it.startsWith(':')) {
      return `(([^/]+\\/)${it.endsWith('?') ? '?' : ''})`;
    }
    return `${it === '*' ? '.*' : (0, _escapeStringRegexp.default)(it)}\\/`;
  }).join('')})`) : undefined;
  return {
    screen: screen,
    regex: regex,
    pattern: pattern,
    path: path,
    routeNames: (0, _toConsumableArray2.default)(routeNames),
    parse: parse
  };
};
var findParseConfigForRoute = function findParseConfigForRoute(routeName, flatConfig) {
  for (var config of flatConfig) {
    if (routeName === config.routeNames[config.routeNames.length - 1]) {
      return config.parse;
    }
  }
  return undefined;
};
var findInitialRoute = function findInitialRoute(routeName, parentScreens, initialRoutes) {
  for (var config of initialRoutes) {
    if (parentScreens.length === config.parentScreens.length) {
      var sameParents = true;
      for (var i = 0; i < parentScreens.length; i++) {
        if (parentScreens[i].localeCompare(config.parentScreens[i]) !== 0) {
          sameParents = false;
          break;
        }
      }
      if (sameParents) {
        return routeName !== config.initialRouteName ? config.initialRouteName : undefined;
      }
    }
  }
  return undefined;
};
var createStateObject = function createStateObject(initialRoute, route, isEmpty) {
  if (isEmpty) {
    if (initialRoute) {
      return {
        index: 1,
        routes: [{
          name: initialRoute
        }, route]
      };
    } else {
      return {
        routes: [route]
      };
    }
  } else {
    if (initialRoute) {
      return {
        index: 1,
        routes: [{
          name: initialRoute
        }, Object.assign({}, route, {
          state: {
            routes: []
          }
        })]
      };
    } else {
      return {
        routes: [Object.assign({}, route, {
          state: {
            routes: []
          }
        })]
      };
    }
  }
};
var createNestedStateObject = function createNestedStateObject(path, routes, initialRoutes, flatConfig) {
  var state;
  var route = routes.shift();
  var parentScreens = [];
  var initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);
  parentScreens.push(route.name);
  state = createStateObject(initialRoute, route, routes.length === 0);
  if (routes.length > 0) {
    var nestedState = state;
    while (route = routes.shift()) {
      initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);
      var nestedStateIndex = nestedState.index || nestedState.routes.length - 1;
      nestedState.routes[nestedStateIndex].state = createStateObject(initialRoute, route, routes.length === 0);
      if (routes.length > 0) {
        nestedState = nestedState.routes[nestedStateIndex].state;
      }
      parentScreens.push(route.name);
    }
  }
  route = (0, _findFocusedRoute.default)(state);
  route.path = path;
  var params = parseQueryParams(path, flatConfig ? findParseConfigForRoute(route.name, flatConfig) : undefined);
  if (params) {
    route.params = Object.assign({}, route.params, params);
  }
  return state;
};
var parseQueryParams = function parseQueryParams(path, parseConfig) {
  var query = path.split('?')[1];
  var params = queryString.parse(query);
  if (parseConfig) {
    Object.keys(params).forEach(function (name) {
      if (Object.hasOwnProperty.call(parseConfig, name) && typeof params[name] === 'string') {
        params[name] = parseConfig[name](params[name]);
      }
    });
  }
  return Object.keys(params).length ? params : undefined;
};

/***/ }),

/***/ 4760:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
var _exportNames = {
  BaseNavigationContainer: true,
  createNavigationContainerRef: true,
  createNavigatorFactory: true,
  CurrentRenderContext: true,
  findFocusedRoute: true,
  getActionFromState: true,
  getFocusedRouteNameFromRoute: true,
  getPathFromState: true,
  getStateFromPath: true,
  NavigationContainerRefContext: true,
  NavigationContext: true,
  NavigationHelpersContext: true,
  NavigationRouteContext: true,
  PreventRemoveContext: true,
  PreventRemoveProvider: true,
  useFocusEffect: true,
  useIsFocused: true,
  useNavigation: true,
  useNavigationBuilder: true,
  useNavigationContainerRef: true,
  useNavigationState: true,
  UNSTABLE_usePreventRemove: true,
  usePreventRemoveContext: true,
  useRoute: true,
  validatePathConfig: true
};
Object.defineProperty(exports, "BaseNavigationContainer", ({
  enumerable: true,
  get: function get() {
    return _BaseNavigationContainer.default;
  }
}));
Object.defineProperty(exports, "CurrentRenderContext", ({
  enumerable: true,
  get: function get() {
    return _CurrentRenderContext.default;
  }
}));
Object.defineProperty(exports, "NavigationContainerRefContext", ({
  enumerable: true,
  get: function get() {
    return _NavigationContainerRefContext.default;
  }
}));
Object.defineProperty(exports, "NavigationContext", ({
  enumerable: true,
  get: function get() {
    return _NavigationContext.default;
  }
}));
Object.defineProperty(exports, "NavigationHelpersContext", ({
  enumerable: true,
  get: function get() {
    return _NavigationHelpersContext.default;
  }
}));
Object.defineProperty(exports, "NavigationRouteContext", ({
  enumerable: true,
  get: function get() {
    return _NavigationRouteContext.default;
  }
}));
Object.defineProperty(exports, "PreventRemoveContext", ({
  enumerable: true,
  get: function get() {
    return _PreventRemoveContext.default;
  }
}));
Object.defineProperty(exports, "PreventRemoveProvider", ({
  enumerable: true,
  get: function get() {
    return _PreventRemoveProvider.default;
  }
}));
Object.defineProperty(exports, "UNSTABLE_usePreventRemove", ({
  enumerable: true,
  get: function get() {
    return _usePreventRemove.default;
  }
}));
Object.defineProperty(exports, "createNavigationContainerRef", ({
  enumerable: true,
  get: function get() {
    return _createNavigationContainerRef.default;
  }
}));
Object.defineProperty(exports, "createNavigatorFactory", ({
  enumerable: true,
  get: function get() {
    return _createNavigatorFactory.default;
  }
}));
Object.defineProperty(exports, "findFocusedRoute", ({
  enumerable: true,
  get: function get() {
    return _findFocusedRoute.default;
  }
}));
Object.defineProperty(exports, "getActionFromState", ({
  enumerable: true,
  get: function get() {
    return _getActionFromState.default;
  }
}));
Object.defineProperty(exports, "getFocusedRouteNameFromRoute", ({
  enumerable: true,
  get: function get() {
    return _getFocusedRouteNameFromRoute.default;
  }
}));
Object.defineProperty(exports, "getPathFromState", ({
  enumerable: true,
  get: function get() {
    return _getPathFromState.default;
  }
}));
Object.defineProperty(exports, "getStateFromPath", ({
  enumerable: true,
  get: function get() {
    return _getStateFromPath.default;
  }
}));
Object.defineProperty(exports, "useFocusEffect", ({
  enumerable: true,
  get: function get() {
    return _useFocusEffect.default;
  }
}));
Object.defineProperty(exports, "useIsFocused", ({
  enumerable: true,
  get: function get() {
    return _useIsFocused.default;
  }
}));
Object.defineProperty(exports, "useNavigation", ({
  enumerable: true,
  get: function get() {
    return _useNavigation.default;
  }
}));
Object.defineProperty(exports, "useNavigationBuilder", ({
  enumerable: true,
  get: function get() {
    return _useNavigationBuilder.default;
  }
}));
Object.defineProperty(exports, "useNavigationContainerRef", ({
  enumerable: true,
  get: function get() {
    return _useNavigationContainerRef.default;
  }
}));
Object.defineProperty(exports, "useNavigationState", ({
  enumerable: true,
  get: function get() {
    return _useNavigationState.default;
  }
}));
Object.defineProperty(exports, "usePreventRemoveContext", ({
  enumerable: true,
  get: function get() {
    return _usePreventRemoveContext.default;
  }
}));
Object.defineProperty(exports, "useRoute", ({
  enumerable: true,
  get: function get() {
    return _useRoute.default;
  }
}));
Object.defineProperty(exports, "validatePathConfig", ({
  enumerable: true,
  get: function get() {
    return _validatePathConfig.default;
  }
}));
var _BaseNavigationContainer = _interopRequireDefault(__nccwpck_require__(4743));
var _createNavigationContainerRef = _interopRequireDefault(__nccwpck_require__(6106));
var _createNavigatorFactory = _interopRequireDefault(__nccwpck_require__(5886));
var _CurrentRenderContext = _interopRequireDefault(__nccwpck_require__(7834));
var _findFocusedRoute = _interopRequireDefault(__nccwpck_require__(390));
var _getActionFromState = _interopRequireDefault(__nccwpck_require__(7018));
var _getFocusedRouteNameFromRoute = _interopRequireDefault(__nccwpck_require__(9546));
var _getPathFromState = _interopRequireDefault(__nccwpck_require__(4025));
var _getStateFromPath = _interopRequireDefault(__nccwpck_require__(2231));
var _NavigationContainerRefContext = _interopRequireDefault(__nccwpck_require__(4952));
var _NavigationContext = _interopRequireDefault(__nccwpck_require__(1298));
var _NavigationHelpersContext = _interopRequireDefault(__nccwpck_require__(6482));
var _NavigationRouteContext = _interopRequireDefault(__nccwpck_require__(7839));
var _PreventRemoveContext = _interopRequireDefault(__nccwpck_require__(4478));
var _PreventRemoveProvider = _interopRequireDefault(__nccwpck_require__(1633));
var _types = __nccwpck_require__(5077);
Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _types[key];
    }
  });
});
var _useFocusEffect = _interopRequireDefault(__nccwpck_require__(2966));
var _useIsFocused = _interopRequireDefault(__nccwpck_require__(61));
var _useNavigation = _interopRequireDefault(__nccwpck_require__(4393));
var _useNavigationBuilder = _interopRequireDefault(__nccwpck_require__(3292));
var _useNavigationContainerRef = _interopRequireDefault(__nccwpck_require__(7502));
var _useNavigationState = _interopRequireDefault(__nccwpck_require__(194));
var _usePreventRemove = _interopRequireDefault(__nccwpck_require__(9607));
var _usePreventRemoveContext = _interopRequireDefault(__nccwpck_require__(7137));
var _useRoute = _interopRequireDefault(__nccwpck_require__(654));
var _validatePathConfig = _interopRequireDefault(__nccwpck_require__(3688));
var _routers = __nccwpck_require__(6844);
Object.keys(_routers).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _routers[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _routers[key];
    }
  });
});

/***/ }),

/***/ 8099:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = isArrayEqual;
function isArrayEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every(function (it, index) {
    return it === b[index];
  });
}

/***/ }),

/***/ 2895:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = isRecordEqual;
function isRecordEqual(a, b) {
  if (a === b) {
    return true;
  }
  var aKeys = Object.keys(a);
  var bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every(function (key) {
    return a[key] === b[key];
  });
}

/***/ }),

/***/ 5077:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.PrivateValueStore = void 0;
var _createClass2 = _interopRequireDefault(__nccwpck_require__(3410));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(7321));
var PrivateValueStore = (0, _createClass2.default)(function PrivateValueStore() {
  (0, _classCallCheck2.default)(this, PrivateValueStore);
});
exports.PrivateValueStore = PrivateValueStore;

/***/ }),

/***/ 5691:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useChildListeners;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useChildListeners() {
  var _React$useRef = React.useRef({
      action: [],
      focus: []
    }),
    listeners = _React$useRef.current;
  var addListener = React.useCallback(function (type, listener) {
    listeners[type].push(listener);
    var removed = false;
    return function () {
      var index = listeners[type].indexOf(listener);
      if (!removed && index > -1) {
        removed = true;
        listeners[type].splice(index, 1);
      }
    };
  }, [listeners]);
  return {
    listeners: listeners,
    addListener: addListener
  };
}

/***/ }),

/***/ 2037:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useComponent;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _jsxRuntime = __nccwpck_require__(8872);
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var NavigationContent = function NavigationContent(_ref) {
  var render = _ref.render,
    children = _ref.children;
  return render(children);
};
function useComponent(render) {
  var renderRef = React.useRef(render);
  renderRef.current = render;
  React.useEffect(function () {
    renderRef.current = null;
  });
  return React.useRef(function (_ref2) {
    var children = _ref2.children;
    var render = renderRef.current;
    if (render === null) {
      throw new Error('The returned component must be rendered in the same render phase as the hook.');
    }
    return (0, _jsxRuntime.jsx)(NavigationContent, {
      render: render,
      children: children
    });
  }).current;
}

/***/ }),

/***/ 6973:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useCurrentRender;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _CurrentRenderContext = _interopRequireDefault(__nccwpck_require__(7834));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useCurrentRender(_ref) {
  var state = _ref.state,
    navigation = _ref.navigation,
    descriptors = _ref.descriptors;
  var current = React.useContext(_CurrentRenderContext.default);
  if (current && navigation.isFocused()) {
    current.options = descriptors[state.routes[state.index].key].options;
  }
}

/***/ }),

/***/ 1717:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useDescriptors;
var _objectWithoutProperties2 = _interopRequireDefault(__nccwpck_require__(8061));
var _toConsumableArray2 = _interopRequireDefault(__nccwpck_require__(4767));
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationBuilderContext = _interopRequireDefault(__nccwpck_require__(4421));
var _NavigationContext = _interopRequireDefault(__nccwpck_require__(1298));
var _NavigationRouteContext = _interopRequireDefault(__nccwpck_require__(7839));
var _SceneView = _interopRequireDefault(__nccwpck_require__(9037));
var _useNavigationCache = _interopRequireDefault(__nccwpck_require__(9954));
var _useRouteCache = _interopRequireDefault(__nccwpck_require__(4903));
var _jsxRuntime = __nccwpck_require__(8872);
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function useDescriptors(_ref) {
  var state = _ref.state,
    screens = _ref.screens,
    navigation = _ref.navigation,
    screenOptions = _ref.screenOptions,
    defaultScreenOptions = _ref.defaultScreenOptions,
    onAction = _ref.onAction,
    getState = _ref.getState,
    setState = _ref.setState,
    addListener = _ref.addListener,
    addKeyedListener = _ref.addKeyedListener,
    onRouteFocus = _ref.onRouteFocus,
    router = _ref.router,
    emitter = _ref.emitter;
  var _React$useState = React.useState({}),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    options = _React$useState2[0],
    setOptions = _React$useState2[1];
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    onDispatchAction = _React$useContext.onDispatchAction,
    onOptionsChange = _React$useContext.onOptionsChange,
    stackRef = _React$useContext.stackRef;
  var context = React.useMemo(function () {
    return {
      navigation: navigation,
      onAction: onAction,
      addListener: addListener,
      addKeyedListener: addKeyedListener,
      onRouteFocus: onRouteFocus,
      onDispatchAction: onDispatchAction,
      onOptionsChange: onOptionsChange,
      stackRef: stackRef
    };
  }, [navigation, onAction, addListener, addKeyedListener, onRouteFocus, onDispatchAction, onOptionsChange, stackRef]);
  var navigations = (0, _useNavigationCache.default)({
    state: state,
    getState: getState,
    navigation: navigation,
    setOptions: setOptions,
    router: router,
    emitter: emitter
  });
  var routes = (0, _useRouteCache.default)(state.routes);
  return routes.reduce(function (acc, route, i) {
    var config = screens[route.name];
    var screen = config.props;
    var navigation = navigations[route.key];
    var optionsList = [screenOptions].concat((0, _toConsumableArray2.default)(config.options ? config.options.filter(Boolean) : []), [screen.options, options[route.key]]);
    var customOptions = optionsList.reduce(function (acc, curr) {
      return Object.assign(acc, typeof curr !== 'function' ? curr : curr({
        route: route,
        navigation: navigation
      }));
    }, {});
    var mergedOptions = Object.assign({}, typeof defaultScreenOptions === 'function' ? defaultScreenOptions({
      route: route,
      navigation: navigation,
      options: customOptions
    }) : defaultScreenOptions, customOptions);
    var clearOptions = function clearOptions() {
      return setOptions(function (o) {
        if (route.key in o) {
          var _route$key = route.key,
            _ = o[_route$key],
            rest = (0, _objectWithoutProperties2.default)(o, [_route$key].map(_toPropertyKey));
          return rest;
        }
        return o;
      });
    };
    acc[route.key] = {
      route: route,
      navigation: navigation,
      render: function render() {
        return (0, _jsxRuntime.jsx)(_NavigationBuilderContext.default.Provider, {
          value: context,
          children: (0, _jsxRuntime.jsx)(_NavigationContext.default.Provider, {
            value: navigation,
            children: (0, _jsxRuntime.jsx)(_NavigationRouteContext.default.Provider, {
              value: route,
              children: (0, _jsxRuntime.jsx)(_SceneView.default, {
                navigation: navigation,
                route: route,
                screen: screen,
                routeState: state.routes[i].state,
                getState: getState,
                setState: setState,
                options: mergedOptions,
                clearOptions: clearOptions
              })
            })
          })
        }, route.key);
      },
      options: mergedOptions
    };
    return acc;
  }, {});
}

/***/ }),

/***/ 7443:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useEventEmitter;
var _toConsumableArray2 = _interopRequireDefault(__nccwpck_require__(4767));
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useEventEmitter(listen) {
  var listenRef = React.useRef(listen);
  React.useEffect(function () {
    listenRef.current = listen;
  });
  var listeners = React.useRef(Object.create(null));
  var create = React.useCallback(function (target) {
    var removeListener = function removeListener(type, callback) {
      var callbacks = listeners.current[type] ? listeners.current[type][target] : undefined;
      if (!callbacks) {
        return;
      }
      var index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
    var addListener = function addListener(type, callback) {
      listeners.current[type] = listeners.current[type] || {};
      listeners.current[type][target] = listeners.current[type][target] || [];
      listeners.current[type][target].push(callback);
      var removed = false;
      return function () {
        if (!removed) {
          removed = true;
          removeListener(type, callback);
        }
      };
    };
    return {
      addListener: addListener,
      removeListener: removeListener
    };
  }, []);
  var emit = React.useCallback(function (_ref) {
    var _items$target, _ref2;
    var type = _ref.type,
      data = _ref.data,
      target = _ref.target,
      canPreventDefault = _ref.canPreventDefault;
    var items = listeners.current[type] || {};
    var callbacks = target !== undefined ? (_items$target = items[target]) == null ? void 0 : _items$target.slice() : (_ref2 = []).concat.apply(_ref2, (0, _toConsumableArray2.default)(Object.keys(items).map(function (t) {
      return items[t];
    }))).filter(function (cb, i, self) {
      return self.lastIndexOf(cb) === i;
    });
    var event = {
      get type() {
        return type;
      }
    };
    if (target !== undefined) {
      Object.defineProperty(event, 'target', {
        enumerable: true,
        get: function get() {
          return target;
        }
      });
    }
    if (data !== undefined) {
      Object.defineProperty(event, 'data', {
        enumerable: true,
        get: function get() {
          return data;
        }
      });
    }
    if (canPreventDefault) {
      var defaultPrevented = false;
      Object.defineProperties(event, {
        defaultPrevented: {
          enumerable: true,
          get: function get() {
            return defaultPrevented;
          }
        },
        preventDefault: {
          enumerable: true,
          value: function value() {
            defaultPrevented = true;
          }
        }
      });
    }
    listenRef.current == null ? void 0 : listenRef.current(event);
    callbacks == null ? void 0 : callbacks.forEach(function (cb) {
      return cb(event);
    });
    return event;
  }, []);
  return React.useMemo(function () {
    return {
      create: create,
      emit: emit
    };
  }, [create, emit]);
}

/***/ }),

/***/ 2966:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useFocusEffect;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _useNavigation = _interopRequireDefault(__nccwpck_require__(4393));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useFocusEffect(effect) {
  var navigation = (0, _useNavigation.default)();
  if (arguments[1] !== undefined) {
    var message = "You passed a second argument to 'useFocusEffect', but it only accepts one argument. " + "If you want to pass a dependency array, you can use 'React.useCallback':\n\n" + 'useFocusEffect(\n' + '  React.useCallback(() => {\n' + '    // Your code here\n' + '  }, [depA, depB])\n' + ');\n\n' + 'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
    console.error(message);
  }
  React.useEffect(function () {
    var isFocused = false;
    var cleanup;
    var callback = function callback() {
      var destroy = effect();
      if (destroy === undefined || typeof destroy === 'function') {
        return destroy;
      }
      if (process.env.NODE_ENV !== 'production') {
        var _message = 'An effect function must not return anything besides a function, which is used for clean-up.';
        if (destroy === null) {
          _message += " You returned 'null'. If your effect does not require clean-up, return 'undefined' (or nothing).";
        } else if (typeof destroy.then === 'function') {
          _message += "\n\nIt looks like you wrote 'useFocusEffect(async () => ...)' or returned a Promise. " + 'Instead, write the async function inside your effect ' + 'and call it immediately:\n\n' + 'useFocusEffect(\n' + '  React.useCallback(() => {\n' + '    async function fetchData() {\n' + '      // You can await here\n' + '      const response = await MyAPI.getData(someId);\n' + '      // ...\n' + '    }\n\n' + '    fetchData();\n' + '  }, [someId])\n' + ');\n\n' + 'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
        } else {
          _message += ` You returned '${JSON.stringify(destroy)}'.`;
        }
        console.error(_message);
      }
    };
    if (navigation.isFocused()) {
      cleanup = callback();
      isFocused = true;
    }
    var unsubscribeFocus = navigation.addListener('focus', function () {
      if (isFocused) {
        return;
      }
      if (cleanup !== undefined) {
        cleanup();
      }
      cleanup = callback();
      isFocused = true;
    });
    var unsubscribeBlur = navigation.addListener('blur', function () {
      if (cleanup !== undefined) {
        cleanup();
      }
      cleanup = undefined;
      isFocused = false;
    });
    return function () {
      if (cleanup !== undefined) {
        cleanup();
      }
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [effect, navigation]);
}

/***/ }),

/***/ 1494:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useFocusEvents;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationContext = _interopRequireDefault(__nccwpck_require__(1298));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useFocusEvents(_ref) {
  var state = _ref.state,
    emitter = _ref.emitter;
  var navigation = React.useContext(_NavigationContext.default);
  var lastFocusedKeyRef = React.useRef();
  var currentFocusedKey = state.routes[state.index].key;
  React.useEffect(function () {
    return navigation == null ? void 0 : navigation.addListener('focus', function () {
      lastFocusedKeyRef.current = currentFocusedKey;
      emitter.emit({
        type: 'focus',
        target: currentFocusedKey
      });
    });
  }, [currentFocusedKey, emitter, navigation]);
  React.useEffect(function () {
    return navigation == null ? void 0 : navigation.addListener('blur', function () {
      lastFocusedKeyRef.current = undefined;
      emitter.emit({
        type: 'blur',
        target: currentFocusedKey
      });
    });
  }, [currentFocusedKey, emitter, navigation]);
  React.useEffect(function () {
    var lastFocusedKey = lastFocusedKeyRef.current;
    lastFocusedKeyRef.current = currentFocusedKey;
    if (lastFocusedKey === undefined && !navigation) {
      emitter.emit({
        type: 'focus',
        target: currentFocusedKey
      });
    }
    if (lastFocusedKey === currentFocusedKey || !(navigation ? navigation.isFocused() : true)) {
      return;
    }
    if (lastFocusedKey === undefined) {
      return;
    }
    emitter.emit({
      type: 'blur',
      target: lastFocusedKey
    });
    emitter.emit({
      type: 'focus',
      target: currentFocusedKey
    });
  }, [currentFocusedKey, emitter, navigation]);
}

/***/ }),

/***/ 5898:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useFocusedListenersChildrenAdapter;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationBuilderContext = _interopRequireDefault(__nccwpck_require__(4421));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useFocusedListenersChildrenAdapter(_ref) {
  var navigation = _ref.navigation,
    focusedListeners = _ref.focusedListeners;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    addListener = _React$useContext.addListener;
  var listener = React.useCallback(function (callback) {
    if (navigation.isFocused()) {
      for (var _listener of focusedListeners) {
        var _listener2 = _listener(callback),
          handled = _listener2.handled,
          result = _listener2.result;
        if (handled) {
          return {
            handled: handled,
            result: result
          };
        }
      }
      return {
        handled: true,
        result: callback(navigation)
      };
    } else {
      return {
        handled: false,
        result: null
      };
    }
  }, [focusedListeners, navigation]);
  React.useEffect(function () {
    return addListener == null ? void 0 : addListener('focus', listener);
  }, [addListener, listener]);
}

/***/ }),

/***/ 61:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useIsFocused;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _useNavigation = _interopRequireDefault(__nccwpck_require__(4393));
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

/***/ }),

/***/ 8445:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useKeyedChildListeners;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useKeyedChildListeners() {
  var _React$useRef = React.useRef(Object.assign(Object.create(null), {
      getState: {},
      beforeRemove: {}
    })),
    keyedListeners = _React$useRef.current;
  var addKeyedListener = React.useCallback(function (type, key, listener) {
    keyedListeners[type][key] = listener;
    return function () {
      keyedListeners[type][key] = undefined;
    };
  }, [keyedListeners]);
  return {
    keyedListeners: keyedListeners,
    addKeyedListener: addKeyedListener
  };
}

/***/ }),

/***/ 4393:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useNavigation;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationContainerRefContext = _interopRequireDefault(__nccwpck_require__(4952));
var _NavigationContext = _interopRequireDefault(__nccwpck_require__(1298));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useNavigation() {
  var root = React.useContext(_NavigationContainerRefContext.default);
  var navigation = React.useContext(_NavigationContext.default);
  if (navigation === undefined && root === undefined) {
    throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
  }
  return navigation != null ? navigation : root;
}

/***/ }),

/***/ 3292:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useNavigationBuilder;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(9148));
var _objectWithoutProperties2 = _interopRequireDefault(__nccwpck_require__(8061));
var _toConsumableArray2 = _interopRequireDefault(__nccwpck_require__(4767));
var _routers = __nccwpck_require__(6844);
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _reactIs = __nccwpck_require__(6262);
var _Group = _interopRequireDefault(__nccwpck_require__(1978));
var _isArrayEqual = _interopRequireDefault(__nccwpck_require__(8099));
var _isRecordEqual = _interopRequireDefault(__nccwpck_require__(2895));
var _NavigationHelpersContext = _interopRequireDefault(__nccwpck_require__(6482));
var _NavigationRouteContext = _interopRequireDefault(__nccwpck_require__(7839));
var _NavigationStateContext = _interopRequireDefault(__nccwpck_require__(4492));
var _PreventRemoveProvider = _interopRequireDefault(__nccwpck_require__(1633));
var _Screen = _interopRequireDefault(__nccwpck_require__(5658));
var _types = __nccwpck_require__(5077);
var _useChildListeners2 = _interopRequireDefault(__nccwpck_require__(5691));
var _useComponent = _interopRequireDefault(__nccwpck_require__(2037));
var _useCurrentRender = _interopRequireDefault(__nccwpck_require__(6973));
var _useDescriptors = _interopRequireDefault(__nccwpck_require__(1717));
var _useEventEmitter = _interopRequireDefault(__nccwpck_require__(7443));
var _useFocusedListenersChildrenAdapter = _interopRequireDefault(__nccwpck_require__(5898));
var _useFocusEvents = _interopRequireDefault(__nccwpck_require__(1494));
var _useKeyedChildListeners = _interopRequireDefault(__nccwpck_require__(8445));
var _useNavigationHelpers = _interopRequireDefault(__nccwpck_require__(3527));
var _useOnAction = _interopRequireDefault(__nccwpck_require__(6230));
var _useOnGetState = _interopRequireDefault(__nccwpck_require__(9653));
var _useOnRouteFocus = _interopRequireDefault(__nccwpck_require__(5804));
var _useRegisterNavigator = _interopRequireDefault(__nccwpck_require__(178));
var _useScheduleUpdate = _interopRequireDefault(__nccwpck_require__(7676));
var _jsxRuntime = __nccwpck_require__(8872);
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

/***/ }),

/***/ 9954:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useNavigationCache;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(9148));
var _objectWithoutProperties2 = _interopRequireDefault(__nccwpck_require__(8061));
var _routers = __nccwpck_require__(6844);
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationBuilderContext = _interopRequireDefault(__nccwpck_require__(4421));
var _excluded = ["emit"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useNavigationCache(_ref) {
  var state = _ref.state,
    getState = _ref.getState,
    navigation = _ref.navigation,
    _setOptions = _ref.setOptions,
    router = _ref.router,
    emitter = _ref.emitter;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    stackRef = _React$useContext.stackRef;
  var cache = React.useMemo(function () {
    return {
      current: {}
    };
  }, [getState, navigation, _setOptions, router, emitter]);
  var actions = Object.assign({}, router.actionCreators, _routers.CommonActions);
  cache.current = state.routes.reduce(function (acc, route) {
    var previous = cache.current[route.key];
    if (previous) {
      acc[route.key] = previous;
    } else {
      var emit = navigation.emit,
        rest = (0, _objectWithoutProperties2.default)(navigation, _excluded);
      var _dispatch = function dispatch(thunk) {
        var action = typeof thunk === 'function' ? thunk(getState()) : thunk;
        if (action != null) {
          navigation.dispatch(Object.assign({
            source: route.key
          }, action));
        }
      };
      var withStack = function withStack(callback) {
        var isStackSet = false;
        try {
          if (process.env.NODE_ENV !== 'production' && stackRef && !stackRef.current) {
            stackRef.current = new Error().stack;
            isStackSet = true;
          }
          callback();
        } finally {
          if (isStackSet && stackRef) {
            stackRef.current = undefined;
          }
        }
      };
      var helpers = Object.keys(actions).reduce(function (acc, name) {
        acc[name] = function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          return withStack(function () {
            return _dispatch(actions[name].apply(actions, args));
          });
        };
        return acc;
      }, {});
      acc[route.key] = Object.assign({}, rest, helpers, emitter.create(route.key), {
        dispatch: function dispatch(thunk) {
          return withStack(function () {
            return _dispatch(thunk);
          });
        },
        getParent: function getParent(id) {
          if (id !== undefined && id === rest.getId()) {
            return acc[route.key];
          }
          return rest.getParent(id);
        },
        setOptions: function setOptions(options) {
          return _setOptions(function (o) {
            return Object.assign({}, o, (0, _defineProperty2.default)({}, route.key, Object.assign({}, o[route.key], options)));
          });
        },
        isFocused: function isFocused() {
          var state = getState();
          if (state.routes[state.index].key !== route.key) {
            return false;
          }
          return navigation ? navigation.isFocused() : true;
        }
      });
    }
    return acc;
  }, {});
  return cache.current;
}

/***/ }),

/***/ 7502:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useNavigationContainerRef;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _createNavigationContainerRef = _interopRequireDefault(__nccwpck_require__(6106));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useNavigationContainerRef() {
  var navigation = React.useRef(null);
  if (navigation.current == null) {
    navigation.current = (0, _createNavigationContainerRef.default)();
  }
  return navigation.current;
}

/***/ }),

/***/ 3527:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useNavigationHelpers;
var _routers = __nccwpck_require__(6844);
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationContext = _interopRequireDefault(__nccwpck_require__(1298));
var _types = __nccwpck_require__(5077);
var _UnhandledActionContext = _interopRequireDefault(__nccwpck_require__(1830));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
_types.PrivateValueStore;
function useNavigationHelpers(_ref) {
  var navigatorId = _ref.id,
    onAction = _ref.onAction,
    getState = _ref.getState,
    emitter = _ref.emitter,
    router = _ref.router;
  var onUnhandledAction = React.useContext(_UnhandledActionContext.default);
  var parentNavigationHelpers = React.useContext(_NavigationContext.default);
  return React.useMemo(function () {
    var dispatch = function dispatch(op) {
      var action = typeof op === 'function' ? op(getState()) : op;
      var handled = onAction(action);
      if (!handled) {
        onUnhandledAction == null ? void 0 : onUnhandledAction(action);
      }
    };
    var actions = Object.assign({}, router.actionCreators, _routers.CommonActions);
    var helpers = Object.keys(actions).reduce(function (acc, name) {
      acc[name] = function () {
        return dispatch(actions[name].apply(actions, arguments));
      };
      return acc;
    }, {});
    var navigationHelpers = Object.assign({}, parentNavigationHelpers, helpers, {
      dispatch: dispatch,
      emit: emitter.emit,
      isFocused: parentNavigationHelpers ? parentNavigationHelpers.isFocused : function () {
        return true;
      },
      canGoBack: function canGoBack() {
        var state = getState();
        return router.getStateForAction(state, _routers.CommonActions.goBack(), {
          routeNames: state.routeNames,
          routeParamList: {},
          routeGetIdList: {}
        }) !== null || (parentNavigationHelpers == null ? void 0 : parentNavigationHelpers.canGoBack()) || false;
      },
      getId: function getId() {
        return navigatorId;
      },
      getParent: function getParent(id) {
        if (id !== undefined) {
          var current = navigationHelpers;
          while (current && id !== current.getId()) {
            current = current.getParent();
          }
          return current;
        }
        return parentNavigationHelpers;
      },
      getState: getState
    });
    return navigationHelpers;
  }, [navigatorId, emitter.emit, getState, onAction, onUnhandledAction, parentNavigationHelpers, router]);
}

/***/ }),

/***/ 194:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useNavigationState;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _useNavigation = _interopRequireDefault(__nccwpck_require__(4393));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useNavigationState(selector) {
  var navigation = (0, _useNavigation.default)();
  var _React$useState = React.useState(function () {
      return selector(navigation.getState());
    }),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    setResult = _React$useState2[1];
  var selectorRef = React.useRef(selector);
  React.useEffect(function () {
    selectorRef.current = selector;
  });
  React.useEffect(function () {
    var unsubscribe = navigation.addListener('state', function (e) {
      setResult(selectorRef.current(e.data.state));
    });
    return unsubscribe;
  }, [navigation]);
  return selector(navigation.getState());
}

/***/ }),

/***/ 6230:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useOnAction;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationBuilderContext = _interopRequireDefault(__nccwpck_require__(4421));
var _useOnPreventRemove = _interopRequireWildcard(__nccwpck_require__(580));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useOnAction(_ref) {
  var router = _ref.router,
    getState = _ref.getState,
    setState = _ref.setState,
    key = _ref.key,
    actionListeners = _ref.actionListeners,
    beforeRemoveListeners = _ref.beforeRemoveListeners,
    routerConfigOptions = _ref.routerConfigOptions,
    emitter = _ref.emitter;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    onActionParent = _React$useContext.onAction,
    onRouteFocusParent = _React$useContext.onRouteFocus,
    addListenerParent = _React$useContext.addListener,
    onDispatchAction = _React$useContext.onDispatchAction;
  var routerConfigOptionsRef = React.useRef(routerConfigOptions);
  React.useEffect(function () {
    routerConfigOptionsRef.current = routerConfigOptions;
  });
  var onAction = React.useCallback(function (action) {
    var visitedNavigators = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Set();
    var state = getState();
    if (visitedNavigators.has(state.key)) {
      return false;
    }
    visitedNavigators.add(state.key);
    if (typeof action.target !== 'string' || action.target === state.key) {
      var result = router.getStateForAction(state, action, routerConfigOptionsRef.current);
      result = result === null && action.target === state.key ? state : result;
      if (result !== null) {
        onDispatchAction(action, state === result);
        if (state !== result) {
          var isPrevented = (0, _useOnPreventRemove.shouldPreventRemove)(emitter, beforeRemoveListeners, state.routes, result.routes, action);
          if (isPrevented) {
            return true;
          }
          setState(result);
        }
        if (onRouteFocusParent !== undefined) {
          var shouldFocus = router.shouldActionChangeFocus(action);
          if (shouldFocus && key !== undefined) {
            onRouteFocusParent(key);
          }
        }
        return true;
      }
    }
    if (onActionParent !== undefined) {
      if (onActionParent(action, visitedNavigators)) {
        return true;
      }
    }
    for (var i = actionListeners.length - 1; i >= 0; i--) {
      var listener = actionListeners[i];
      if (listener(action, visitedNavigators)) {
        return true;
      }
    }
    return false;
  }, [actionListeners, beforeRemoveListeners, emitter, getState, key, onActionParent, onDispatchAction, onRouteFocusParent, router, setState]);
  (0, _useOnPreventRemove.default)({
    getState: getState,
    emitter: emitter,
    beforeRemoveListeners: beforeRemoveListeners
  });
  React.useEffect(function () {
    return addListenerParent == null ? void 0 : addListenerParent('action', onAction);
  }, [addListenerParent, onAction]);
  return onAction;
}

/***/ }),

/***/ 9653:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useOnGetState;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _isArrayEqual = _interopRequireDefault(__nccwpck_require__(8099));
var _NavigationBuilderContext = _interopRequireDefault(__nccwpck_require__(4421));
var _NavigationRouteContext = _interopRequireDefault(__nccwpck_require__(7839));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useOnGetState(_ref) {
  var getState = _ref.getState,
    getStateListeners = _ref.getStateListeners;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    addKeyedListener = _React$useContext.addKeyedListener;
  var route = React.useContext(_NavigationRouteContext.default);
  var key = route ? route.key : 'root';
  var getRehydratedState = React.useCallback(function () {
    var state = getState();
    var routes = state.routes.map(function (route) {
      var _getStateListeners$ro;
      var childState = (_getStateListeners$ro = getStateListeners[route.key]) == null ? void 0 : _getStateListeners$ro.call(getStateListeners);
      if (route.state === childState) {
        return route;
      }
      return Object.assign({}, route, {
        state: childState
      });
    });
    if ((0, _isArrayEqual.default)(state.routes, routes)) {
      return state;
    }
    return Object.assign({}, state, {
      routes: routes
    });
  }, [getState, getStateListeners]);
  React.useEffect(function () {
    return addKeyedListener == null ? void 0 : addKeyedListener('getState', key, getRehydratedState);
  }, [addKeyedListener, getRehydratedState, key]);
}

/***/ }),

/***/ 580:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useOnPreventRemove;
exports.shouldPreventRemove = void 0;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(9148));
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationBuilderContext = _interopRequireDefault(__nccwpck_require__(4421));
var _NavigationRouteContext = _interopRequireDefault(__nccwpck_require__(7839));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var VISITED_ROUTE_KEYS = Symbol('VISITED_ROUTE_KEYS');
var shouldPreventRemove = function shouldPreventRemove(emitter, beforeRemoveListeners, currentRoutes, nextRoutes, action) {
  var _action$VISITED_ROUTE;
  var nextRouteKeys = nextRoutes.map(function (route) {
    return route.key;
  });
  var removedRoutes = currentRoutes.filter(function (route) {
    return !nextRouteKeys.includes(route.key);
  }).reverse();
  var visitedRouteKeys = (_action$VISITED_ROUTE = action[VISITED_ROUTE_KEYS]) != null ? _action$VISITED_ROUTE : new Set();
  var beforeRemoveAction = Object.assign({}, action, (0, _defineProperty2.default)({}, VISITED_ROUTE_KEYS, visitedRouteKeys));
  for (var route of removedRoutes) {
    var _beforeRemoveListener;
    if (visitedRouteKeys.has(route.key)) {
      continue;
    }
    var isPrevented = (_beforeRemoveListener = beforeRemoveListeners[route.key]) == null ? void 0 : _beforeRemoveListener.call(beforeRemoveListeners, beforeRemoveAction);
    if (isPrevented) {
      return true;
    }
    visitedRouteKeys.add(route.key);
    var event = emitter.emit({
      type: 'beforeRemove',
      target: route.key,
      data: {
        action: beforeRemoveAction
      },
      canPreventDefault: true
    });
    if (event.defaultPrevented) {
      return true;
    }
  }
  return false;
};
exports.shouldPreventRemove = shouldPreventRemove;
function useOnPreventRemove(_ref) {
  var getState = _ref.getState,
    emitter = _ref.emitter,
    beforeRemoveListeners = _ref.beforeRemoveListeners;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    addKeyedListener = _React$useContext.addKeyedListener;
  var route = React.useContext(_NavigationRouteContext.default);
  var routeKey = route == null ? void 0 : route.key;
  React.useEffect(function () {
    if (routeKey) {
      return addKeyedListener == null ? void 0 : addKeyedListener('beforeRemove', routeKey, function (action) {
        var state = getState();
        return shouldPreventRemove(emitter, beforeRemoveListeners, state.routes, [], action);
      });
    }
  }, [addKeyedListener, beforeRemoveListeners, emitter, getState, routeKey]);
}

/***/ }),

/***/ 5804:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useOnRouteFocus;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationBuilderContext = _interopRequireDefault(__nccwpck_require__(4421));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useOnRouteFocus(_ref) {
  var router = _ref.router,
    getState = _ref.getState,
    sourceRouteKey = _ref.key,
    setState = _ref.setState;
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    onRouteFocusParent = _React$useContext.onRouteFocus;
  return React.useCallback(function (key) {
    var state = getState();
    var result = router.getStateForRouteFocus(state, key);
    if (result !== state) {
      setState(result);
    }
    if (onRouteFocusParent !== undefined && sourceRouteKey !== undefined) {
      onRouteFocusParent(sourceRouteKey);
    }
  }, [getState, onRouteFocusParent, router, setState, sourceRouteKey]);
}

/***/ }),

/***/ 9660:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useOptionsGetters;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationBuilderContext = _interopRequireDefault(__nccwpck_require__(4421));
var _NavigationStateContext = _interopRequireDefault(__nccwpck_require__(4492));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useOptionsGetters(_ref) {
  var key = _ref.key,
    options = _ref.options,
    navigation = _ref.navigation;
  var optionsRef = React.useRef(options);
  var optionsGettersFromChildRef = React.useRef({});
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    onOptionsChange = _React$useContext.onOptionsChange;
  var _React$useContext2 = React.useContext(_NavigationStateContext.default),
    parentAddOptionsGetter = _React$useContext2.addOptionsGetter;
  var optionsChangeListener = React.useCallback(function () {
    var _navigation$isFocused;
    var isFocused = (_navigation$isFocused = navigation == null ? void 0 : navigation.isFocused()) != null ? _navigation$isFocused : true;
    var hasChildren = Object.keys(optionsGettersFromChildRef.current).length;
    if (isFocused && !hasChildren) {
      var _optionsRef$current;
      onOptionsChange((_optionsRef$current = optionsRef.current) != null ? _optionsRef$current : {});
    }
  }, [navigation, onOptionsChange]);
  React.useEffect(function () {
    optionsRef.current = options;
    optionsChangeListener();
    return navigation == null ? void 0 : navigation.addListener('focus', optionsChangeListener);
  }, [navigation, options, optionsChangeListener]);
  var getOptionsFromListener = React.useCallback(function () {
    for (var _key in optionsGettersFromChildRef.current) {
      if (optionsGettersFromChildRef.current.hasOwnProperty(_key)) {
        var _optionsGettersFromCh, _optionsGettersFromCh2;
        var result = (_optionsGettersFromCh = (_optionsGettersFromCh2 = optionsGettersFromChildRef.current)[_key]) == null ? void 0 : _optionsGettersFromCh.call(_optionsGettersFromCh2);
        if (result !== null) {
          return result;
        }
      }
    }
    return null;
  }, []);
  var getCurrentOptions = React.useCallback(function () {
    var _navigation$isFocused2;
    var isFocused = (_navigation$isFocused2 = navigation == null ? void 0 : navigation.isFocused()) != null ? _navigation$isFocused2 : true;
    if (!isFocused) {
      return null;
    }
    var optionsFromListener = getOptionsFromListener();
    if (optionsFromListener !== null) {
      return optionsFromListener;
    }
    return optionsRef.current;
  }, [navigation, getOptionsFromListener]);
  React.useEffect(function () {
    return parentAddOptionsGetter == null ? void 0 : parentAddOptionsGetter(key, getCurrentOptions);
  }, [getCurrentOptions, parentAddOptionsGetter, key]);
  var addOptionsGetter = React.useCallback(function (key, getter) {
    optionsGettersFromChildRef.current[key] = getter;
    optionsChangeListener();
    return function () {
      delete optionsGettersFromChildRef.current[key];
      optionsChangeListener();
    };
  }, [optionsChangeListener]);
  return {
    addOptionsGetter: addOptionsGetter,
    getCurrentOptions: getCurrentOptions
  };
}

/***/ }),

/***/ 9607:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = usePreventRemove;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var _nonSecure = __nccwpck_require__(7883);
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _useLatestCallback = _interopRequireDefault(__nccwpck_require__(5478));
var _useNavigation = _interopRequireDefault(__nccwpck_require__(4393));
var _usePreventRemoveContext = _interopRequireDefault(__nccwpck_require__(7137));
var _useRoute2 = _interopRequireDefault(__nccwpck_require__(654));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function usePreventRemove(preventRemove, callback) {
  var _React$useState = React.useState(function () {
      return (0, _nonSecure.nanoid)();
    }),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 1),
    id = _React$useState2[0];
  var navigation = (0, _useNavigation.default)();
  var _useRoute = (0, _useRoute2.default)(),
    routeKey = _useRoute.key;
  var _usePreventRemoveCont = (0, _usePreventRemoveContext.default)(),
    setPreventRemove = _usePreventRemoveCont.setPreventRemove;
  React.useEffect(function () {
    setPreventRemove(id, routeKey, preventRemove);
    return function () {
      setPreventRemove(id, routeKey, false);
    };
  }, [setPreventRemove, id, routeKey, preventRemove]);
  var beforeRemoveListener = (0, _useLatestCallback.default)(function (e) {
    if (!preventRemove) {
      return;
    }
    e.preventDefault();
    callback({
      data: e.data
    });
  });
  React.useEffect(function () {
    return navigation == null ? void 0 : navigation.addListener('beforeRemove', beforeRemoveListener);
  }, [navigation, beforeRemoveListener]);
}

/***/ }),

/***/ 7137:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = usePreventRemoveContext;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _PreventRemoveContext = _interopRequireDefault(__nccwpck_require__(4478));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function usePreventRemoveContext() {
  var value = React.useContext(_PreventRemoveContext.default);
  if (value == null) {
    throw new Error("Couldn't find the prevent remove context. Is your component inside NavigationContent?");
  }
  return value;
}

/***/ }),

/***/ 178:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useRegisterNavigator;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var _nonSecure = __nccwpck_require__(7883);
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _EnsureSingleNavigator = __nccwpck_require__(3328);
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useRegisterNavigator() {
  var _React$useState = React.useState(function () {
      return (0, _nonSecure.nanoid)();
    }),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 1),
    key = _React$useState2[0];
  var container = React.useContext(_EnsureSingleNavigator.SingleNavigatorContext);
  if (container === undefined) {
    throw new Error("Couldn't register the navigator. Have you wrapped your app with 'NavigationContainer'?\n\nThis can also happen if there are multiple copies of '@react-navigation' packages installed.");
  }
  React.useEffect(function () {
    var register = container.register,
      unregister = container.unregister;
    register(key);
    return function () {
      return unregister(key);
    };
  }, [container, key]);
  return key;
}

/***/ }),

/***/ 654:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useRoute;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _NavigationRouteContext = _interopRequireDefault(__nccwpck_require__(7839));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useRoute() {
  var route = React.useContext(_NavigationRouteContext.default);
  if (route === undefined) {
    throw new Error("Couldn't find a route object. Is your component inside a screen in a navigator?");
  }
  return route;
}

/***/ }),

/***/ 4903:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.CHILD_STATE = void 0;
exports["default"] = useRouteCache;
var _objectWithoutProperties2 = _interopRequireDefault(__nccwpck_require__(8061));
var React = _interopRequireWildcard(__nccwpck_require__(7522));
var _excluded = ["state"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var CHILD_STATE = Symbol('CHILD_STATE');
exports.CHILD_STATE = CHILD_STATE;
function useRouteCache(routes) {
  var cache = React.useMemo(function () {
    return {
      current: new Map()
    };
  }, []);
  if (process.env.NODE_ENV === 'production') {
    return routes;
  }
  cache.current = routes.reduce(function (acc, route) {
    var previous = cache.current.get(route);
    if (previous) {
      acc.set(route, previous);
    } else {
      var state = route.state,
        proxy = (0, _objectWithoutProperties2.default)(route, _excluded);
      Object.defineProperty(proxy, CHILD_STATE, {
        enumerable: false,
        value: state
      });
      acc.set(route, proxy);
    }
    return acc;
  }, new Map());
  return Array.from(cache.current.values());
}

/***/ }),

/***/ 7676:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.ScheduleUpdateContext = void 0;
exports["default"] = useScheduleUpdate;
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var MISSING_CONTEXT_ERROR = "Couldn't find a schedule context.";
var ScheduleUpdateContext = React.createContext({
  scheduleUpdate: function scheduleUpdate() {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  flushUpdates: function flushUpdates() {
    throw new Error(MISSING_CONTEXT_ERROR);
  }
});
exports.ScheduleUpdateContext = ScheduleUpdateContext;
function useScheduleUpdate(callback) {
  var _React$useContext = React.useContext(ScheduleUpdateContext),
    scheduleUpdate = _React$useContext.scheduleUpdate,
    flushUpdates = _React$useContext.flushUpdates;
  scheduleUpdate(callback);
  React.useEffect(flushUpdates);
}

/***/ }),

/***/ 6015:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = useSyncState;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var React = _interopRequireWildcard(__nccwpck_require__(7522));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var UNINTIALIZED_STATE = {};
function useSyncState(initialState) {
  var stateRef = React.useRef(UNINTIALIZED_STATE);
  var isSchedulingRef = React.useRef(false);
  var isMountedRef = React.useRef(true);
  React.useEffect(function () {
    isMountedRef.current = true;
    return function () {
      isMountedRef.current = false;
    };
  }, []);
  if (stateRef.current === UNINTIALIZED_STATE) {
    stateRef.current = typeof initialState === 'function' ? initialState() : initialState;
  }
  var _React$useState = React.useState(stateRef.current),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    trackingState = _React$useState2[0],
    setTrackingState = _React$useState2[1];
  var getState = React.useCallback(function () {
    return stateRef.current;
  }, []);
  var setState = React.useCallback(function (state) {
    if (state === stateRef.current || !isMountedRef.current) {
      return;
    }
    stateRef.current = state;
    if (!isSchedulingRef.current) {
      setTrackingState(state);
    }
  }, []);
  var scheduleUpdate = React.useCallback(function (callback) {
    isSchedulingRef.current = true;
    try {
      callback();
    } finally {
      isSchedulingRef.current = false;
    }
  }, []);
  var flushUpdates = React.useCallback(function () {
    if (!isMountedRef.current) {
      return;
    }
    setTrackingState(stateRef.current);
  }, []);
  if (trackingState !== stateRef.current) {
    setTrackingState(stateRef.current);
  }
  var state = stateRef.current;
  React.useDebugValue(state);
  return [state, getState, setState, scheduleUpdate, flushUpdates];
}

/***/ }),

/***/ 3688:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(9973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = validatePathConfig;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(9250));
var formatToList = function formatToList(items) {
  return items.map(function (key) {
    return `- ${key}`;
  }).join('\n');
};
function validatePathConfig(config) {
  var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var validKeys = ['initialRouteName', 'screens'];
  if (!root) {
    validKeys.push('path', 'exact', 'stringify', 'parse');
  }
  var invalidKeys = Object.keys(config).filter(function (key) {
    return !validKeys.includes(key);
  });
  if (invalidKeys.length) {
    throw new Error(`Found invalid properties in the configuration:\n${formatToList(invalidKeys)}\n\nDid you forget to specify them under a 'screens' property?\n\nYou can only specify the following properties:\n${formatToList(validKeys)}\n\nSee https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration.`);
  }
  if (config.screens) {
    Object.entries(config.screens).forEach(function (_ref) {
      var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
        _ = _ref2[0],
        value = _ref2[1];
      if (typeof value !== 'string') {
        validatePathConfig(value, false);
      }
    });
  }
}

/***/ }),

/***/ 7321:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/classCallCheck");

/***/ }),

/***/ 3410:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/createClass");

/***/ }),

/***/ 9148:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/defineProperty");

/***/ }),

/***/ 9973:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/interopRequireDefault");

/***/ }),

/***/ 8061:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/objectWithoutProperties");

/***/ }),

/***/ 9250:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/slicedToArray");

/***/ }),

/***/ 4767:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/toConsumableArray");

/***/ }),

/***/ 6844:
/***/ (function(module) {

"use strict";
module.exports = require("@react-navigation/routers");

/***/ }),

/***/ 6430:
/***/ (function(module) {

"use strict";
module.exports = require("escape-string-regexp");

/***/ }),

/***/ 7883:
/***/ (function(module) {

"use strict";
module.exports = require("nanoid/non-secure");

/***/ }),

/***/ 1804:
/***/ (function(module) {

"use strict";
module.exports = require("query-string");

/***/ }),

/***/ 7522:
/***/ (function(module) {

"use strict";
module.exports = require("react");

/***/ }),

/***/ 6262:
/***/ (function(module) {

"use strict";
module.exports = require("react-is");

/***/ }),

/***/ 8872:
/***/ (function(module) {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ }),

/***/ 5478:
/***/ (function(module) {

"use strict";
module.exports = require("use-latest-callback");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = "" + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(4760);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;