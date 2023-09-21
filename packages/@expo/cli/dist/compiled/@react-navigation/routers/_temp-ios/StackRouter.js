var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StackActions = void 0;
exports.default = StackRouter;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _nonSecure = require("nanoid/non-secure");
var _BaseRouter = _interopRequireDefault(require("./BaseRouter"));
var StackActions = {
  replace: function replace(name, params) {
    return {
      type: 'REPLACE',
      payload: {
        name: name,
        params: params
      }
    };
  },
  push: function push(name, params) {
    return {
      type: 'PUSH',
      payload: {
        name: name,
        params: params
      }
    };
  },
  pop: function pop() {
    var count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    return {
      type: 'POP',
      payload: {
        count: count
      }
    };
  },
  popToTop: function popToTop() {
    return {
      type: 'POP_TO_TOP'
    };
  }
};
exports.StackActions = StackActions;
function StackRouter(options) {
  var router = Object.assign({}, _BaseRouter.default, {
    type: 'stack',
    getInitialState: function getInitialState(_ref) {
      var routeNames = _ref.routeNames,
        routeParamList = _ref.routeParamList;
      var initialRouteName = options.initialRouteName !== undefined && routeNames.includes(options.initialRouteName) ? options.initialRouteName : routeNames[0];
      return {
        stale: false,
        type: 'stack',
        key: `stack-${(0, _nonSecure.nanoid)()}`,
        index: 0,
        routeNames: routeNames,
        routes: [{
          key: `${initialRouteName}-${(0, _nonSecure.nanoid)()}`,
          name: initialRouteName,
          params: routeParamList[initialRouteName]
        }]
      };
    },
    getRehydratedState: function getRehydratedState(partialState, _ref2) {
      var routeNames = _ref2.routeNames,
        routeParamList = _ref2.routeParamList;
      var state = partialState;
      if (state.stale === false) {
        return state;
      }
      var routes = state.routes.filter(function (route) {
        return routeNames.includes(route.name);
      }).map(function (route) {
        return Object.assign({}, route, {
          key: route.key || `${route.name}-${(0, _nonSecure.nanoid)()}`,
          params: routeParamList[route.name] !== undefined ? Object.assign({}, routeParamList[route.name], route.params) : route.params
        });
      });
      if (routes.length === 0) {
        var initialRouteName = options.initialRouteName !== undefined ? options.initialRouteName : routeNames[0];
        routes.push({
          key: `${initialRouteName}-${(0, _nonSecure.nanoid)()}`,
          name: initialRouteName,
          params: routeParamList[initialRouteName]
        });
      }
      return {
        stale: false,
        type: 'stack',
        key: `stack-${(0, _nonSecure.nanoid)()}`,
        index: routes.length - 1,
        routeNames: routeNames,
        routes: routes
      };
    },
    getStateForRouteNamesChange: function getStateForRouteNamesChange(state, _ref3) {
      var routeNames = _ref3.routeNames,
        routeParamList = _ref3.routeParamList,
        routeKeyChanges = _ref3.routeKeyChanges;
      var routes = state.routes.filter(function (route) {
        return routeNames.includes(route.name) && !routeKeyChanges.includes(route.name);
      });
      if (routes.length === 0) {
        var initialRouteName = options.initialRouteName !== undefined && routeNames.includes(options.initialRouteName) ? options.initialRouteName : routeNames[0];
        routes.push({
          key: `${initialRouteName}-${(0, _nonSecure.nanoid)()}`,
          name: initialRouteName,
          params: routeParamList[initialRouteName]
        });
      }
      return Object.assign({}, state, {
        routeNames: routeNames,
        routes: routes,
        index: Math.min(state.index, routes.length - 1)
      });
    },
    getStateForRouteFocus: function getStateForRouteFocus(state, key) {
      var index = state.routes.findIndex(function (r) {
        return r.key === key;
      });
      if (index === -1 || index === state.index) {
        return state;
      }
      return Object.assign({}, state, {
        index: index,
        routes: state.routes.slice(0, index + 1)
      });
    },
    getStateForAction: function getStateForAction(state, action, options) {
      var routeParamList = options.routeParamList;
      switch (action.type) {
        case 'REPLACE':
          {
            var index = action.target === state.key && action.source ? state.routes.findIndex(function (r) {
              return r.key === action.source;
            }) : state.index;
            if (index === -1) {
              return null;
            }
            var _action$payload = action.payload,
              name = _action$payload.name,
              key = _action$payload.key,
              _params = _action$payload.params;
            if (!state.routeNames.includes(name)) {
              return null;
            }
            return Object.assign({}, state, {
              routes: state.routes.map(function (route, i) {
                return i === index ? {
                  key: key !== undefined ? key : `${name}-${(0, _nonSecure.nanoid)()}`,
                  name: name,
                  params: routeParamList[name] !== undefined ? Object.assign({}, routeParamList[name], _params) : _params
                } : route;
              })
            });
          }
        case 'PUSH':
          if (state.routeNames.includes(action.payload.name)) {
            var getId = options.routeGetIdList[action.payload.name];
            var id = getId == null ? void 0 : getId({
              params: action.payload.params
            });
            var route = id ? state.routes.find(function (route) {
              return route.name === action.payload.name && id === (getId == null ? void 0 : getId({
                params: route.params
              }));
            }) : undefined;
            var routes;
            if (route) {
              routes = state.routes.filter(function (r) {
                return r.key !== route.key;
              });
              routes.push(Object.assign({}, route, {
                params: routeParamList[action.payload.name] !== undefined ? Object.assign({}, routeParamList[action.payload.name], action.payload.params) : action.payload.params
              }));
            } else {
              routes = [].concat((0, _toConsumableArray2.default)(state.routes), [{
                key: `${action.payload.name}-${(0, _nonSecure.nanoid)()}`,
                name: action.payload.name,
                params: routeParamList[action.payload.name] !== undefined ? Object.assign({}, routeParamList[action.payload.name], action.payload.params) : action.payload.params
              }]);
            }
            return Object.assign({}, state, {
              index: routes.length - 1,
              routes: routes
            });
          }
          return null;
        case 'POP':
          {
            var _index = action.target === state.key && action.source ? state.routes.findIndex(function (r) {
              return r.key === action.source;
            }) : state.index;
            if (_index > 0) {
              var _count = Math.max(_index - action.payload.count + 1, 1);
              var _routes = state.routes.slice(0, _count).concat(state.routes.slice(_index + 1));
              return Object.assign({}, state, {
                index: _routes.length - 1,
                routes: _routes
              });
            }
            return null;
          }
        case 'POP_TO_TOP':
          return router.getStateForAction(state, {
            type: 'POP',
            payload: {
              count: state.routes.length - 1
            }
          }, options);
        case 'NAVIGATE':
          if (action.payload.name !== undefined && !state.routeNames.includes(action.payload.name)) {
            return null;
          }
          if (action.payload.key || action.payload.name) {
            var _action$payload$path;
            var _index2 = -1;
            var _getId = action.payload.key === undefined && action.payload.name !== undefined ? options.routeGetIdList[action.payload.name] : undefined;
            var _id = _getId == null ? void 0 : _getId({
              params: action.payload.params
            });
            if (_id) {
              _index2 = state.routes.findIndex(function (route) {
                return route.name === action.payload.name && _id === (_getId == null ? void 0 : _getId({
                  params: route.params
                }));
              });
            } else if (state.routes[state.index].name === action.payload.name && action.payload.key === undefined || state.routes[state.index].key === action.payload.key) {
              _index2 = state.index;
            } else {
              for (var i = state.routes.length - 1; i >= 0; i--) {
                if (state.routes[i].name === action.payload.name && action.payload.key === undefined || state.routes[i].key === action.payload.key) {
                  _index2 = i;
                  break;
                }
              }
            }
            if (_index2 === -1 && action.payload.key && action.payload.name === undefined) {
              return null;
            }
            if (_index2 === -1 && action.payload.name !== undefined) {
              var _action$payload$key;
              var _routes2 = [].concat((0, _toConsumableArray2.default)(state.routes), [{
                key: (_action$payload$key = action.payload.key) != null ? _action$payload$key : `${action.payload.name}-${(0, _nonSecure.nanoid)()}`,
                name: action.payload.name,
                path: action.payload.path,
                params: routeParamList[action.payload.name] !== undefined ? Object.assign({}, routeParamList[action.payload.name], action.payload.params) : action.payload.params
              }]);
              return Object.assign({}, state, {
                routes: _routes2,
                index: _routes2.length - 1
              });
            }
            var _route = state.routes[_index2];
            var _params2;
            if (action.payload.merge) {
              _params2 = action.payload.params !== undefined || routeParamList[_route.name] !== undefined ? Object.assign({}, routeParamList[_route.name], _route.params, action.payload.params) : _route.params;
            } else {
              _params2 = routeParamList[_route.name] !== undefined ? Object.assign({}, routeParamList[_route.name], action.payload.params) : action.payload.params;
            }
            return Object.assign({}, state, {
              index: _index2,
              routes: [].concat((0, _toConsumableArray2.default)(state.routes.slice(0, _index2)), [_params2 !== _route.params || action.payload.path && action.payload.path !== _route.path ? Object.assign({}, _route, {
                path: (_action$payload$path = action.payload.path) != null ? _action$payload$path : _route.path,
                params: _params2
              }) : state.routes[_index2]])
            });
          }
          return null;
        case 'GO_BACK':
          if (state.index > 0) {
            return router.getStateForAction(state, {
              type: 'POP',
              payload: {
                count: 1
              },
              target: action.target,
              source: action.source
            }, options);
          }
          return null;
        default:
          return _BaseRouter.default.getStateForAction(state, action);
      }
    },
    actionCreators: StackActions
  });
  return router;
}