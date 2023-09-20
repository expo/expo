'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _invariant = _interopRequireDefault(require("invariant"));
var customBubblingEventTypes = {};
var customDirectEventTypes = {};
exports.customBubblingEventTypes = customBubblingEventTypes;
exports.customDirectEventTypes = customDirectEventTypes;
var viewConfigCallbacks = new Map();
var viewConfigs = new Map();
function processEventTypes(viewConfig) {
  var bubblingEventTypes = viewConfig.bubblingEventTypes,
    directEventTypes = viewConfig.directEventTypes;
  if (__DEV__) {
    if (bubblingEventTypes != null && directEventTypes != null) {
      for (var topLevelType in directEventTypes) {
        (0, _invariant.default)(bubblingEventTypes[topLevelType] == null, 'Event cannot be both direct and bubbling: %s', topLevelType);
      }
    }
  }
  if (bubblingEventTypes != null) {
    for (var _topLevelType2 in bubblingEventTypes) {
      if (customBubblingEventTypes[_topLevelType2] == null) {
        customBubblingEventTypes[_topLevelType2] = bubblingEventTypes[_topLevelType2];
      }
    }
  }
  if (directEventTypes != null) {
    for (var _topLevelType4 in directEventTypes) {
      if (customDirectEventTypes[_topLevelType4] == null) {
        customDirectEventTypes[_topLevelType4] = directEventTypes[_topLevelType4];
      }
    }
  }
}
exports.register = function (name, callback) {
  (0, _invariant.default)(!viewConfigCallbacks.has(name), 'Tried to register two views with the same name %s', name);
  (0, _invariant.default)(typeof callback === 'function', 'View config getter callback for component `%s` must be a function (received `%s`)', name, callback === null ? 'null' : typeof callback);
  viewConfigCallbacks.set(name, callback);
  return name;
};
exports.get = function (name) {
  var viewConfig;
  if (!viewConfigs.has(name)) {
    var callback = viewConfigCallbacks.get(name);
    if (typeof callback !== 'function') {
      (0, _invariant.default)(false, 'View config getter callback for component `%s` must be a function (received `%s`).%s', name, callback === null ? 'null' : typeof callback, typeof name[0] === 'string' && /[a-z]/.test(name[0]) ? ' Make sure to start component names with a capital letter.' : '');
    }
    viewConfig = callback();
    processEventTypes(viewConfig);
    viewConfigs.set(name, viewConfig);
    viewConfigCallbacks.set(name, null);
  } else {
    viewConfig = viewConfigs.get(name);
  }
  (0, _invariant.default)(viewConfig, 'View config not found for name %s', name);
  return viewConfig;
};
//# sourceMappingURL=ReactNativeViewConfigRegistry.js.map