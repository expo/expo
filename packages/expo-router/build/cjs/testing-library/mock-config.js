"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMockConfig = getMockConfig;
exports.getMockContext = getMockContext;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _contextStubs() {
  const data = require("./context-stubs");
  _contextStubs = function () {
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
function _getRoutes() {
  const data = require("../getRoutes");
  _getRoutes = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function isOverrideContext(context) {
  return Boolean(typeof context === 'object' && 'appDir' in context);
}
function getMockConfig(context, metaOnly = true) {
  return (0, _getLinkingConfig().getNavigationConfig)((0, _getRoutes().getExactRoutes)(getMockContext(context)), metaOnly);
}
function getMockContext(context) {
  if (typeof context === 'string') {
    return (0, _contextStubs().requireContext)(_path().default.resolve(process.cwd(), context));
  } else if (Array.isArray(context)) {
    return (0, _contextStubs().inMemoryContext)(Object.fromEntries(context.map(filename => [filename, {
      default: () => null
    }])));
  } else if (isOverrideContext(context)) {
    return (0, _contextStubs().requireContextWithOverrides)(context.appDir, context.overrides);
  } else {
    return (0, _contextStubs().inMemoryContext)(context);
  }
}
//# sourceMappingURL=mock-config.js.map