Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _nonSecure = require("nanoid/non-secure");
var BaseRouter = {
  getStateForAction: function getStateForAction(state, action) {
    switch (action.type) {
      case 'SET_PARAMS':
        {
          var index = action.source ? state.routes.findIndex(function (r) {
            return r.key === action.source;
          }) : state.index;
          if (index === -1) {
            return null;
          }
          return Object.assign({}, state, {
            routes: state.routes.map(function (r, i) {
              return i === index ? Object.assign({}, r, {
                params: Object.assign({}, r.params, action.payload.params)
              }) : r;
            })
          });
        }
      case 'RESET':
        {
          var nextState = action.payload;
          if (nextState.routes.length === 0 || nextState.routes.some(function (route) {
            return !state.routeNames.includes(route.name);
          })) {
            return null;
          }
          if (nextState.stale === false) {
            if (state.routeNames.length !== nextState.routeNames.length || nextState.routeNames.some(function (name) {
              return !state.routeNames.includes(name);
            })) {
              return null;
            }
            return Object.assign({}, nextState, {
              routes: nextState.routes.map(function (route) {
                return route.key ? route : Object.assign({}, route, {
                  key: `${route.name}-${(0, _nonSecure.nanoid)()}`
                });
              })
            });
          }
          return nextState;
        }
      default:
        return null;
    }
  },
  shouldActionChangeFocus: function shouldActionChangeFocus(action) {
    return action.type === 'NAVIGATE';
  }
};
var _default = BaseRouter;
exports.default = _default;