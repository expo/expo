var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _routers = require("@react-navigation/routers");
var React = _interopRequireWildcard(require("react"));
var _checkDuplicateRouteNames = _interopRequireDefault(require("./checkDuplicateRouteNames"));
var _checkSerializable = _interopRequireDefault(require("./checkSerializable"));
var _createNavigationContainerRef = require("./createNavigationContainerRef");
var _EnsureSingleNavigator = _interopRequireDefault(require("./EnsureSingleNavigator"));
var _findFocusedRoute = _interopRequireDefault(require("./findFocusedRoute"));
var _NavigationBuilderContext = _interopRequireDefault(require("./NavigationBuilderContext"));
var _NavigationContainerRefContext = _interopRequireDefault(require("./NavigationContainerRefContext"));
var _NavigationContext = _interopRequireDefault(require("./NavigationContext"));
var _NavigationRouteContext = _interopRequireDefault(require("./NavigationRouteContext"));
var _NavigationStateContext = _interopRequireDefault(require("./NavigationStateContext"));
var _UnhandledActionContext = _interopRequireDefault(require("./UnhandledActionContext"));
var _useChildListeners2 = _interopRequireDefault(require("./useChildListeners"));
var _useEventEmitter = _interopRequireDefault(require("./useEventEmitter"));
var _useKeyedChildListeners = _interopRequireDefault(require("./useKeyedChildListeners"));
var _useOptionsGetters2 = _interopRequireDefault(require("./useOptionsGetters"));
var _useScheduleUpdate = require("./useScheduleUpdate");
var _useSyncState3 = _interopRequireDefault(require("./useSyncState"));
var _jsxRuntime = require("react/jsx-runtime");
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
exports.default = _default;