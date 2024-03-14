"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  renderRouter: true,
  testRouter: true,
  MockContextConfig: true,
  getMockConfig: true,
  getMockContext: true
};
Object.defineProperty(exports, "MockContextConfig", {
  enumerable: true,
  get: function () {
    return _mockConfig().MockContextConfig;
  }
});
Object.defineProperty(exports, "getMockConfig", {
  enumerable: true,
  get: function () {
    return _mockConfig().getMockConfig;
  }
});
Object.defineProperty(exports, "getMockContext", {
  enumerable: true,
  get: function () {
    return _mockConfig().getMockContext;
  }
});
exports.renderRouter = renderRouter;
exports.testRouter = void 0;
require("./expect");
var _reactNative = require("@testing-library/react-native");
Object.keys(_reactNative).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _reactNative[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _reactNative[key];
    }
  });
});
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _mockConfig() {
  const data = require("./mock-config");
  _mockConfig = function () {
    return data;
  };
  return data;
}
function _mocks() {
  const data = require("./mocks");
  _mocks = function () {
    return data;
  };
  return data;
}
function _ExpoRoot() {
  const data = require("../ExpoRoot");
  _ExpoRoot = function () {
    return data;
  };
  return data;
}
function _getPathFromState() {
  const data = _interopRequireDefault(require("../fork/getPathFromState"));
  _getPathFromState = function () {
    return data;
  };
  return data;
}
function _getLinkingConfig() {
  const data = require("../getLinkingConfig");
  _getLinkingConfig = function () {
    return data;
  };
  return data;
}
function _routerStore() {
  const data = require("../global-state/router-store");
  _routerStore = function () {
    return data;
  };
  return data;
}
function _imperativeApi() {
  const data = require("../imperative-api");
  _imperativeApi = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/// <reference types="../../types/jest" />

// re-export everything

function renderRouter(context = './app', {
  initialUrl = '/',
  ...options
} = {}) {
  const mockContext = (0, _mockConfig().getMockContext)(context);

  // Reset the initial URL
  (0, _mocks().setInitialUrl)(initialUrl);

  // Force the render to be synchronous
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  _getLinkingConfig().stateCache.clear();
  let location;
  if (typeof initialUrl === 'string') {
    location = new URL(initialUrl, 'test://');
  } else if (initialUrl instanceof URL) {
    location = initialUrl;
  }
  const result = (0, _reactNative.render)( /*#__PURE__*/_react().default.createElement(_ExpoRoot().ExpoRoot, {
    context: mockContext,
    location: location
  }), {
    ...options
  });
  return Object.assign(result, {
    getPathname() {
      return _routerStore().store.routeInfoSnapshot().pathname;
    },
    getSegments() {
      return _routerStore().store.routeInfoSnapshot().segments;
    },
    getSearchParams() {
      return _routerStore().store.routeInfoSnapshot().params;
    },
    getPathnameWithParams() {
      return (0, _getPathFromState().default)(_routerStore().store.rootState, _routerStore().store.linking.config);
    }
  });
}
const testRouter = exports.testRouter = {
  /** Navigate to the provided pathname and the pathname */
  navigate(path) {
    (0, _reactNative.act)(() => _imperativeApi().router.navigate(path));
    expect(_reactNative.screen).toHavePathnameWithParams(path);
  },
  /** Push the provided pathname and assert the pathname */
  push(path) {
    (0, _reactNative.act)(() => _imperativeApi().router.push(path));
    expect(_reactNative.screen).toHavePathnameWithParams(path);
  },
  /** Replace with provided pathname and assert the pathname */
  replace(path) {
    (0, _reactNative.act)(() => _imperativeApi().router.replace(path));
    expect(_reactNative.screen).toHavePathnameWithParams(path);
  },
  /** Go back in history and asset the new pathname */
  back(path) {
    expect(_imperativeApi().router.canGoBack()).toBe(true);
    (0, _reactNative.act)(() => _imperativeApi().router.back());
    if (path) {
      expect(_reactNative.screen).toHavePathnameWithParams(path);
    }
  },
  /** If there's history that supports invoking the `back` function. */
  canGoBack() {
    return _imperativeApi().router.canGoBack();
  },
  /** Update the current route query params and assert the new pathname */
  setParams(params, path) {
    _imperativeApi().router.setParams(params);
    if (path) {
      expect(_reactNative.screen).toHavePathnameWithParams(path);
    }
  },
  /** If there's history that supports invoking the `back` function. */
  dismissAll() {
    (0, _reactNative.act)(() => _imperativeApi().router.dismissAll());
  }
};
//# sourceMappingURL=index.js.map