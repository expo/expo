var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getStateFromPath;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _escapeStringRegexp = _interopRequireDefault(require("escape-string-regexp"));
var queryString = _interopRequireWildcard(require("query-string"));
var _findFocusedRoute = _interopRequireDefault(require("./findFocusedRoute"));
var _validatePathConfig = _interopRequireDefault(require("./validatePathConfig"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function getStateFromPath(path, options) {
  var _ref;
  if (options) {
    (0, _validatePathConfig.default)(options);
  }
  var initialRoutes = [];
  if (options != null && options.initialRouteName) {
    initialRoutes.push({
      initialRouteName: options.initialRouteName,
      parentScreens: []
    });
  }
  var screens = options == null ? void 0 : options.screens;
  var remaining = path.replace(/\/+/g, '/').replace(/^\//, '').replace(/\?.*$/, '');
  remaining = remaining.endsWith('/') ? remaining : `${remaining}/`;
  if (screens === undefined) {
    var _routes = remaining.split('/').filter(Boolean).map(function (segment) {
      var name = decodeURIComponent(segment);
      return {
        name: name
      };
    });
    if (_routes.length) {
      return createNestedStateObject(path, _routes, initialRoutes);
    }
    return undefined;
  }
  var configs = (_ref = []).concat.apply(_ref, (0, _toConsumableArray2.default)(Object.keys(screens).map(function (key) {
    return createNormalizedConfigs(key, screens, [], initialRoutes, []);
  }))).sort(function (a, b) {
    if (a.pattern === b.pattern) {
      return b.routeNames.join('>').localeCompare(a.routeNames.join('>'));
    }
    if (a.pattern.startsWith(b.pattern)) {
      return -1;
    }
    if (b.pattern.startsWith(a.pattern)) {
      return 1;
    }
    var aParts = a.pattern.split('/');
    var bParts = b.pattern.split('/');
    for (var i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if (aParts[i] == null) {
        return 1;
      }
      if (bParts[i] == null) {
        return -1;
      }
      var aWildCard = aParts[i] === '*' || aParts[i].startsWith(':');
      var bWildCard = bParts[i] === '*' || bParts[i].startsWith(':');
      if (aWildCard && bWildCard) {
        continue;
      }
      if (aWildCard) {
        return 1;
      }
      if (bWildCard) {
        return -1;
      }
    }
    return bParts.length - aParts.length;
  });
  configs.reduce(function (acc, config) {
    if (acc[config.pattern]) {
      var a = acc[config.pattern].routeNames;
      var b = config.routeNames;
      var intersects = a.length > b.length ? b.every(function (it, i) {
        return a[i] === it;
      }) : a.every(function (it, i) {
        return b[i] === it;
      });
      if (!intersects) {
        throw new Error(`Found conflicting screens with the same pattern. The pattern '${config.pattern}' resolves to both '${a.join(' > ')}' and '${b.join(' > ')}'. Patterns must be unique and cannot resolve to more than one screen.`);
      }
    }
    return Object.assign(acc, (0, _defineProperty2.default)({}, config.pattern, config));
  }, {});
  if (remaining === '/') {
    var match = configs.find(function (config) {
      return config.path === '' && config.routeNames.every(function (name) {
        var _configs$find;
        return !((_configs$find = configs.find(function (c) {
          return c.screen === name;
        })) != null && _configs$find.path);
      });
    });
    if (match) {
      return createNestedStateObject(path, match.routeNames.map(function (name) {
        return {
          name: name
        };
      }), initialRoutes, configs);
    }
    return undefined;
  }
  var result;
  var current;
  var _matchAgainstConfigs = matchAgainstConfigs(remaining, configs.map(function (c) {
      return Object.assign({}, c, {
        regex: c.regex ? new RegExp(c.regex.source + '$') : undefined
      });
    })),
    routes = _matchAgainstConfigs.routes,
    remainingPath = _matchAgainstConfigs.remainingPath;
  if (routes !== undefined) {
    current = createNestedStateObject(path, routes, initialRoutes, configs);
    remaining = remainingPath;
    result = current;
  }
  if (current == null || result == null) {
    return undefined;
  }
  return result;
}
var joinPaths = function joinPaths() {
  var _ref2;
  for (var _len = arguments.length, paths = new Array(_len), _key = 0; _key < _len; _key++) {
    paths[_key] = arguments[_key];
  }
  return (_ref2 = []).concat.apply(_ref2, (0, _toConsumableArray2.default)(paths.map(function (p) {
    return p.split('/');
  }))).filter(Boolean).join('/');
};
var matchAgainstConfigs = function matchAgainstConfigs(remaining, configs) {
  var routes;
  var remainingPath = remaining;
  var _loop = function _loop() {
    if (!config.regex) {
      return "continue";
    }
    var match = remainingPath.match(config.regex);
    if (match) {
      var _config$pattern;
      var matchedParams = (_config$pattern = config.pattern) == null ? void 0 : _config$pattern.split('/').filter(function (p) {
        return p.startsWith(':');
      }).reduce(function (acc, p, i) {
        return Object.assign(acc, (0, _defineProperty2.default)({}, p, match[(i + 1) * 2].replace(/\//, '')));
      }, {});
      routes = config.routeNames.map(function (name) {
        var _config$path;
        var config = configs.find(function (c) {
          return c.screen === name;
        });
        var params = config == null ? void 0 : (_config$path = config.path) == null ? void 0 : _config$path.split('/').filter(function (p) {
          return p.startsWith(':');
        }).reduce(function (acc, p) {
          var value = matchedParams[p];
          if (value) {
            var _config$parse;
            var key = p.replace(/^:/, '').replace(/\?$/, '');
            acc[key] = (_config$parse = config.parse) != null && _config$parse[key] ? config.parse[key](value) : value;
          }
          return acc;
        }, {});
        if (params && Object.keys(params).length) {
          return {
            name: name,
            params: params
          };
        }
        return {
          name: name
        };
      });
      remainingPath = remainingPath.replace(match[1], '');
      return "break";
    }
  };
  for (var config of configs) {
    var _ret = _loop();
    if (_ret === "continue") continue;
    if (_ret === "break") break;
  }
  return {
    routes: routes,
    remainingPath: remainingPath
  };
};
var createNormalizedConfigs = function createNormalizedConfigs(screen, routeConfig) {
  var routeNames = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var initials = arguments.length > 3 ? arguments[3] : undefined;
  var parentScreens = arguments.length > 4 ? arguments[4] : undefined;
  var parentPattern = arguments.length > 5 ? arguments[5] : undefined;
  var configs = [];
  routeNames.push(screen);
  parentScreens.push(screen);
  var config = routeConfig[screen];
  if (typeof config === 'string') {
    var pattern = parentPattern ? joinPaths(parentPattern, config) : config;
    configs.push(createConfigItem(screen, routeNames, pattern, config));
  } else if (typeof config === 'object') {
    var _pattern;
    if (typeof config.path === 'string') {
      if (config.exact && config.path === undefined) {
        throw new Error("A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`.");
      }
      _pattern = config.exact !== true ? joinPaths(parentPattern || '', config.path || '') : config.path || '';
      configs.push(createConfigItem(screen, routeNames, _pattern, config.path, config.parse));
    }
    if (config.screens) {
      if (config.initialRouteName) {
        initials.push({
          initialRouteName: config.initialRouteName,
          parentScreens: parentScreens
        });
      }
      Object.keys(config.screens).forEach(function (nestedConfig) {
        var _pattern2;
        var result = createNormalizedConfigs(nestedConfig, config.screens, routeNames, initials, (0, _toConsumableArray2.default)(parentScreens), (_pattern2 = _pattern) != null ? _pattern2 : parentPattern);
        configs.push.apply(configs, (0, _toConsumableArray2.default)(result));
      });
    }
  }
  routeNames.pop();
  return configs;
};
var createConfigItem = function createConfigItem(screen, routeNames, pattern, path, parse) {
  pattern = pattern.split('/').filter(Boolean).join('/');
  var regex = pattern ? new RegExp(`^(${pattern.split('/').map(function (it) {
    if (it.startsWith(':')) {
      return `(([^/]+\\/)${it.endsWith('?') ? '?' : ''})`;
    }
    return `${it === '*' ? '.*' : (0, _escapeStringRegexp.default)(it)}\\/`;
  }).join('')})`) : undefined;
  return {
    screen: screen,
    regex: regex,
    pattern: pattern,
    path: path,
    routeNames: (0, _toConsumableArray2.default)(routeNames),
    parse: parse
  };
};
var findParseConfigForRoute = function findParseConfigForRoute(routeName, flatConfig) {
  for (var config of flatConfig) {
    if (routeName === config.routeNames[config.routeNames.length - 1]) {
      return config.parse;
    }
  }
  return undefined;
};
var findInitialRoute = function findInitialRoute(routeName, parentScreens, initialRoutes) {
  for (var config of initialRoutes) {
    if (parentScreens.length === config.parentScreens.length) {
      var sameParents = true;
      for (var i = 0; i < parentScreens.length; i++) {
        if (parentScreens[i].localeCompare(config.parentScreens[i]) !== 0) {
          sameParents = false;
          break;
        }
      }
      if (sameParents) {
        return routeName !== config.initialRouteName ? config.initialRouteName : undefined;
      }
    }
  }
  return undefined;
};
var createStateObject = function createStateObject(initialRoute, route, isEmpty) {
  if (isEmpty) {
    if (initialRoute) {
      return {
        index: 1,
        routes: [{
          name: initialRoute
        }, route]
      };
    } else {
      return {
        routes: [route]
      };
    }
  } else {
    if (initialRoute) {
      return {
        index: 1,
        routes: [{
          name: initialRoute
        }, Object.assign({}, route, {
          state: {
            routes: []
          }
        })]
      };
    } else {
      return {
        routes: [Object.assign({}, route, {
          state: {
            routes: []
          }
        })]
      };
    }
  }
};
var createNestedStateObject = function createNestedStateObject(path, routes, initialRoutes, flatConfig) {
  var state;
  var route = routes.shift();
  var parentScreens = [];
  var initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);
  parentScreens.push(route.name);
  state = createStateObject(initialRoute, route, routes.length === 0);
  if (routes.length > 0) {
    var nestedState = state;
    while (route = routes.shift()) {
      initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);
      var nestedStateIndex = nestedState.index || nestedState.routes.length - 1;
      nestedState.routes[nestedStateIndex].state = createStateObject(initialRoute, route, routes.length === 0);
      if (routes.length > 0) {
        nestedState = nestedState.routes[nestedStateIndex].state;
      }
      parentScreens.push(route.name);
    }
  }
  route = (0, _findFocusedRoute.default)(state);
  route.path = path;
  var params = parseQueryParams(path, flatConfig ? findParseConfigForRoute(route.name, flatConfig) : undefined);
  if (params) {
    route.params = Object.assign({}, route.params, params);
  }
  return state;
};
var parseQueryParams = function parseQueryParams(path, parseConfig) {
  var query = path.split('?')[1];
  var params = queryString.parse(query);
  if (parseConfig) {
    Object.keys(params).forEach(function (name) {
      if (Object.hasOwnProperty.call(parseConfig, name) && typeof params[name] === 'string') {
        params[name] = parseConfig[name](params[name]);
      }
    });
  }
  return Object.keys(params).length ? params : undefined;
};