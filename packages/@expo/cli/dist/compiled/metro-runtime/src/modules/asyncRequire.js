"use strict";
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var DEFAULT_OPTIONS = {
  isPrefetchOnly: false
};
function asyncRequireImpl(_x, _x2, _x3) {
  return _asyncRequireImpl.apply(this, arguments);
}
function _asyncRequireImpl() {
  _asyncRequireImpl = (0, _asyncToGenerator2.default)(function* (moduleID, paths, options) {
    var loadBundle = global[`${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`];
    if (loadBundle != null) {
      var stringModuleID = String(moduleID);
      if (paths != null) {
        var bundlePath = paths[stringModuleID];
        if (bundlePath != null) {
          yield loadBundle(bundlePath);
        }
      }
    }
    if (!options.isPrefetchOnly) {
      return require.importAll(moduleID);
    }
    return undefined;
  });
  return _asyncRequireImpl.apply(this, arguments);
}
function asyncRequire(_x4, _x5, _x6) {
  return _asyncRequire.apply(this, arguments);
}
function _asyncRequire() {
  _asyncRequire = (0, _asyncToGenerator2.default)(function* (moduleID, paths, moduleName) {
    return asyncRequireImpl(moduleID, paths, DEFAULT_OPTIONS);
  });
  return _asyncRequire.apply(this, arguments);
}
asyncRequire.prefetch = function (moduleID, paths, moduleName) {
  asyncRequireImpl(moduleID, paths, {
    isPrefetchOnly: true
  }).then(function () {}, function () {});
};
module.exports = asyncRequire;
//# sourceMappingURL=asyncRequire.js.map