var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useNavigationCache;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _routers = require("@react-navigation/routers");
var React = _interopRequireWildcard(require("react"));
var _NavigationBuilderContext = _interopRequireDefault(require("./NavigationBuilderContext"));
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