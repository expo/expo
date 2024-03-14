"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWatchHandler = getWatchHandler;
exports.regenerateDeclarations = void 0;
function _nodeFs() {
  const data = _interopRequireDefault(require("node:fs"));
  _nodeFs = function () {
    return data;
  };
  return data;
}
function _nodePath() {
  const data = _interopRequireDefault(require("node:path"));
  _nodePath = function () {
    return data;
  };
  return data;
}
function _generate() {
  const data = require("./generate");
  _generate = function () {
    return data;
  };
  return data;
}
function _ctxShared() {
  const data = require("expo-router/_ctx-shared");
  _ctxShared = function () {
    return data;
  };
  return data;
}
function _matchers() {
  const data = require("../matchers");
  _matchers = function () {
    return data;
  };
  return data;
}
function _requireContextPonyfill() {
  const data = _interopRequireDefault(require("../testing-library/require-context-ponyfill"));
  _requireContextPonyfill = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const ctx = (0, _requireContextPonyfill().default)(process.env.EXPO_ROUTER_APP_ROOT, true, _ctxShared().EXPO_ROUTER_CTX_IGNORE);

/**
 * Generate a Metro watch handler that regenerates the typed routes declaration file
 */
function getWatchHandler(outputDir) {
  const routeFiles = new Set(ctx.keys().filter(key => (0, _matchers().isTypedRoute)(key)));
  return async function callback({
    filePath,
    type
  }) {
    let shouldRegenerate = false;
    if (type === 'delete') {
      ctx.__delete(filePath);
      if (routeFiles.has(filePath)) {
        routeFiles.delete(filePath);
        shouldRegenerate = true;
      }
    } else if (type === 'add') {
      ctx.__add(filePath);
      shouldRegenerate = (0, _matchers().isTypedRoute)(filePath);
    } else {
      shouldRegenerate = routeFiles.has(filePath);
    }
    if (shouldRegenerate) {
      regenerateDeclarations(outputDir);
    }
  };
}

/**
 * A throttled function that regenerates the typed routes declaration file
 */
const regenerateDeclarations = exports.regenerateDeclarations = throttle(outputDir => {
  const file = (0, _generate().getTypedRoutesDeclarationFile)(ctx);
  if (!file) return;
  _nodeFs().default.writeFileSync(_nodePath().default.resolve(outputDir, './router.d.ts'), file);
}, 100);

/**
 * Throttles a function to only run once every `internal` milliseconds.
 * If called while waiting, it will run again after the timer has elapsed.
 */
function throttle(fn, interval) {
  let timerId;
  let shouldRunAgain = false;
  return function run(...args) {
    if (timerId) {
      shouldRunAgain = true;
    } else {
      fn(...args);
      timerId = setTimeout(() => {
        timerId = null; // reset the timer so next call will be executed
        if (shouldRunAgain) {
          run(...args); // call the function again
        }
      }, interval);
    }
  };
}
//# sourceMappingURL=index.js.map