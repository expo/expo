var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useDescriptors;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var React = _interopRequireWildcard(require("react"));
var _NavigationBuilderContext = _interopRequireDefault(require("./NavigationBuilderContext"));
var _NavigationContext = _interopRequireDefault(require("./NavigationContext"));
var _NavigationRouteContext = _interopRequireDefault(require("./NavigationRouteContext"));
var _SceneView = _interopRequireDefault(require("./SceneView"));
var _useNavigationCache = _interopRequireDefault(require("./useNavigationCache"));
var _useRouteCache = _interopRequireDefault(require("./useRouteCache"));
var _jsxRuntime = require("react/jsx-runtime");
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