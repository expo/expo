var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getActionFromState;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
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