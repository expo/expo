var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useNavigationHelpers;
var _routers = require("@react-navigation/routers");
var React = _interopRequireWildcard(require("react"));
var _NavigationContext = _interopRequireDefault(require("./NavigationContext"));
var _types = require("./types");
var _UnhandledActionContext = _interopRequireDefault(require("./UnhandledActionContext"));
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