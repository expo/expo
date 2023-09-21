var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getPathFromState;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var queryString = _interopRequireWildcard(require("query-string"));
var _fromEntries = _interopRequireDefault(require("./fromEntries"));
var _validatePathConfig = _interopRequireDefault(require("./validatePathConfig"));
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