var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TabActions = void 0;
exports.default = TabRouter;
var _nonSecure = require("nanoid/non-secure");
var _BaseRouter = _interopRequireDefault(require("./BaseRouter"));
var TYPE_ROUTE = 'route';
var TabActions = {
  jumpTo: function jumpTo(name, params) {
    return {
      type: 'JUMP_TO',
      payload: {
        name: name,
        params: params
      }
    };
  }
};
exports.TabActions = TabActions;
var getRouteHistory = function getRouteHistory(routes, index, backBehavior, initialRouteName) {
  var history = [{
    type: TYPE_ROUTE,
    key: routes[index].key
  }];
  var initialRouteIndex;
  switch (backBehavior) {
    case 'order':
      for (var i = index; i > 0; i--) {
        history.unshift({
          type: TYPE_ROUTE,
          key: routes[i - 1].key
        });
      }
      break;
    case 'firstRoute':
      if (index !== 0) {
        history.unshift({
          type: TYPE_ROUTE,
          key: routes[0].key
        });
      }
      break;
    case 'initialRoute':
      initialRouteIndex = routes.findIndex(function (route) {
        return route.name === initialRouteName;
      });
      initialRouteIndex = initialRouteIndex === -1 ? 0 : initialRouteIndex;
      if (index !== initialRouteIndex) {
        history.unshift({
          type: TYPE_ROUTE,
          key: routes[initialRouteIndex].key
        });
      }
      break;
    case 'history':
      break;
  }
  return history;
};
var changeIndex = function changeIndex(state, index, backBehavior, initialRouteName) {
  var history;
  if (backBehavior === 'history') {
    var currentKey = state.routes[index].key;
    history = state.history.filter(function (it) {
      return it.type === 'route' ? it.key !== currentKey : false;
    }).concat({
      type: TYPE_ROUTE,
      key: currentKey
    });
  } else {
    history = getRouteHistory(state.routes, index, backBehavior, initialRouteName);
  }
  return Object.assign({}, state, {
    index: index,
    history: history
  });
};
function TabRouter(_ref) {
  var initialRouteName = _ref.initialRouteName,
    _ref$backBehavior = _ref.backBehavior,
    backBehavior = _ref$backBehavior === void 0 ? 'firstRoute' : _ref$backBehavior;
  var router = Object.assign({}, _BaseRouter.default, {
    type: 'tab',
    getInitialState: function getInitialState(_ref2) {
      var routeNames = _ref2.routeNames,
        routeParamList = _ref2.routeParamList;
      var index = initialRouteName !== undefined && routeNames.includes(initialRouteName) ? routeNames.indexOf(initialRouteName) : 0;
      var routes = routeNames.map(function (name) {
        return {
          name: name,
          key: `${name}-${(0, _nonSecure.nanoid)()}`,
          params: routeParamList[name]
        };
      });
      var history = getRouteHistory(routes, index, backBehavior, initialRouteName);
      return {
        stale: false,
        type: 'tab',
        key: `tab-${(0, _nonSecure.nanoid)()}`,
        index: index,
        routeNames: routeNames,
        history: history,
        routes: routes
      };
    },
    getRehydratedState: function getRehydratedState(partialState, _ref3) {
      var _state$routes, _state$index, _state$history$filter, _state$history;
      var routeNames = _ref3.routeNames,
        routeParamList = _ref3.routeParamList;
      var state = partialState;
      if (state.stale === false) {
        return state;
      }
      var routes = routeNames.map(function (name) {
        var route = state.routes.find(function (r) {
          return r.name === name;
        });
        return Object.assign({}, route, {
          name: name,
          key: route && route.name === name && route.key ? route.key : `${name}-${(0, _nonSecure.nanoid)()}`,
          params: routeParamList[name] !== undefined ? Object.assign({}, routeParamList[name], route ? route.params : undefined) : route ? route.params : undefined
        });
      });
      var index = Math.min(Math.max(routeNames.indexOf((_state$routes = state.routes[(_state$index = state == null ? void 0 : state.index) != null ? _state$index : 0]) == null ? void 0 : _state$routes.name), 0), routes.length - 1);
      var history = (_state$history$filter = (_state$history = state.history) == null ? void 0 : _state$history.filter(function (it) {
        return routes.find(function (r) {
          return r.key === it.key;
        });
      })) != null ? _state$history$filter : [];
      return changeIndex({
        stale: false,
        type: 'tab',
        key: `tab-${(0, _nonSecure.nanoid)()}`,
        index: index,
        routeNames: routeNames,
        history: history,
        routes: routes
      }, index, backBehavior, initialRouteName);
    },
    getStateForRouteNamesChange: function getStateForRouteNamesChange(state, _ref4) {
      var routeNames = _ref4.routeNames,
        routeParamList = _ref4.routeParamList,
        routeKeyChanges = _ref4.routeKeyChanges;
      var routes = routeNames.map(function (name) {
        return state.routes.find(function (r) {
          return r.name === name && !routeKeyChanges.includes(r.name);
        }) || {
          name: name,
          key: `${name}-${(0, _nonSecure.nanoid)()}`,
          params: routeParamList[name]
        };
      });
      var index = Math.max(0, routeNames.indexOf(state.routes[state.index].name));
      var history = state.history.filter(function (it) {
        return it.type !== 'route' || routes.find(function (r) {
          return r.key === it.key;
        });
      });
      if (!history.length) {
        history = getRouteHistory(routes, index, backBehavior, initialRouteName);
      }
      return Object.assign({}, state, {
        history: history,
        routeNames: routeNames,
        routes: routes,
        index: index
      });
    },
    getStateForRouteFocus: function getStateForRouteFocus(state, key) {
      var index = state.routes.findIndex(function (r) {
        return r.key === key;
      });
      if (index === -1 || index === state.index) {
        return state;
      }
      return changeIndex(state, index, backBehavior, initialRouteName);
    },
    getStateForAction: function getStateForAction(state, action, _ref5) {
      var routeParamList = _ref5.routeParamList,
        routeGetIdList = _ref5.routeGetIdList;
      switch (action.type) {
        case 'JUMP_TO':
        case 'NAVIGATE':
          {
            var index = -1;
            if (action.type === 'NAVIGATE' && action.payload.key) {
              index = state.routes.findIndex(function (route) {
                return route.key === action.payload.key;
              });
            } else {
              index = state.routes.findIndex(function (route) {
                return route.name === action.payload.name;
              });
            }
            if (index === -1) {
              return null;
            }
            return changeIndex(Object.assign({}, state, {
              routes: state.routes.map(function (route, i) {
                if (i !== index) {
                  return route;
                }
                var getId = routeGetIdList[route.name];
                var currentId = getId == null ? void 0 : getId({
                  params: route.params
                });
                var nextId = getId == null ? void 0 : getId({
                  params: action.payload.params
                });
                var key = currentId === nextId ? route.key : `${route.name}-${(0, _nonSecure.nanoid)()}`;
                var params;
                if (action.type === 'NAVIGATE' && action.payload.merge && currentId === nextId) {
                  params = action.payload.params !== undefined || routeParamList[route.name] !== undefined ? Object.assign({}, routeParamList[route.name], route.params, action.payload.params) : route.params;
                } else {
                  params = routeParamList[route.name] !== undefined ? Object.assign({}, routeParamList[route.name], action.payload.params) : action.payload.params;
                }
                var path = action.type === 'NAVIGATE' && action.payload.path != null ? action.payload.path : route.path;
                return params !== route.params || path !== route.path ? Object.assign({}, route, {
                  key: key,
                  path: path,
                  params: params
                }) : route;
              })
            }), index, backBehavior, initialRouteName);
          }
        case 'GO_BACK':
          {
            if (state.history.length === 1) {
              return null;
            }
            var previousKey = state.history[state.history.length - 2].key;
            var _index = state.routes.findIndex(function (route) {
              return route.key === previousKey;
            });
            if (_index === -1) {
              return null;
            }
            return Object.assign({}, state, {
              history: state.history.slice(0, -1),
              index: _index
            });
          }
        default:
          return _BaseRouter.default.getStateForAction(state, action);
      }
    },
    shouldActionChangeFocus: function shouldActionChangeFocus(action) {
      return action.type === 'NAVIGATE';
    },
    actionCreators: TabActions
  });
  return router;
}