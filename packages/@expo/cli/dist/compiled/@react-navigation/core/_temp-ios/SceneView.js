var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SceneView;
var React = _interopRequireWildcard(require("react"));
var _EnsureSingleNavigator = _interopRequireDefault(require("./EnsureSingleNavigator"));
var _NavigationStateContext = _interopRequireDefault(require("./NavigationStateContext"));
var _StaticContainer = _interopRequireDefault(require("./StaticContainer"));
var _useOptionsGetters2 = _interopRequireDefault(require("./useOptionsGetters"));
var _jsxRuntime = require("react/jsx-runtime");
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