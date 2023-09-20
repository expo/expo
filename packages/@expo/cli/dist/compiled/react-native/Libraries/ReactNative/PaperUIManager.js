var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeUIManager = _interopRequireDefault(require("./NativeUIManager"));
var NativeModules = require('../BatchedBridge/NativeModules');
var defineLazyObjectProperty = require('../Utilities/defineLazyObjectProperty');
var Platform = require('../Utilities/Platform');
var UIManagerProperties = require('./UIManagerProperties');
var viewManagerConfigs = {};
var triedLoadingConfig = new Set();
var NativeUIManagerConstants = {};
var isNativeUIManagerConstantsSet = false;
function _getConstants() {
  if (!isNativeUIManagerConstantsSet) {
    NativeUIManagerConstants = _NativeUIManager.default.getConstants();
    isNativeUIManagerConstantsSet = true;
  }
  return NativeUIManagerConstants;
}
function _getViewManagerConfig(viewManagerName) {
  if (viewManagerConfigs[viewManagerName] === undefined && global.nativeCallSyncHook && _NativeUIManager.default.getConstantsForViewManager) {
    try {
      viewManagerConfigs[viewManagerName] = _NativeUIManager.default.getConstantsForViewManager(viewManagerName);
    } catch (e) {
      console.error("NativeUIManager.getConstantsForViewManager('" + viewManagerName + "') threw an exception.", e);
      viewManagerConfigs[viewManagerName] = null;
    }
  }
  var config = viewManagerConfigs[viewManagerName];
  if (config) {
    return config;
  }
  if (!global.nativeCallSyncHook) {
    return config;
  }
  if (_NativeUIManager.default.lazilyLoadView && !triedLoadingConfig.has(viewManagerName)) {
    var result = _NativeUIManager.default.lazilyLoadView(viewManagerName);
    triedLoadingConfig.add(viewManagerName);
    if (result != null && result.viewConfig != null) {
      _getConstants()[viewManagerName] = result.viewConfig;
      lazifyViewManagerConfig(viewManagerName);
    }
  }
  return viewManagerConfigs[viewManagerName];
}
var UIManagerJS = Object.assign({}, _NativeUIManager.default, {
  createView: function createView(reactTag, viewName, rootTag, props) {
    if (Platform.OS === 'ios' && viewManagerConfigs[viewName] === undefined) {
      _getViewManagerConfig(viewName);
    }
    _NativeUIManager.default.createView(reactTag, viewName, rootTag, props);
  },
  getConstants: function getConstants() {
    return _getConstants();
  },
  getViewManagerConfig: function getViewManagerConfig(viewManagerName) {
    return _getViewManagerConfig(viewManagerName);
  },
  hasViewManagerConfig: function hasViewManagerConfig(viewManagerName) {
    return _getViewManagerConfig(viewManagerName) != null;
  }
});
_NativeUIManager.default.getViewManagerConfig = UIManagerJS.getViewManagerConfig;
function lazifyViewManagerConfig(viewName) {
  var viewConfig = _getConstants()[viewName];
  viewManagerConfigs[viewName] = viewConfig;
  if (viewConfig.Manager) {
    defineLazyObjectProperty(viewConfig, 'Constants', {
      get: function get() {
        var viewManager = NativeModules[viewConfig.Manager];
        var constants = {};
        viewManager && Object.keys(viewManager).forEach(function (key) {
          var value = viewManager[key];
          if (typeof value !== 'function') {
            constants[key] = value;
          }
        });
        return constants;
      }
    });
    defineLazyObjectProperty(viewConfig, 'Commands', {
      get: function get() {
        var viewManager = NativeModules[viewConfig.Manager];
        var commands = {};
        var index = 0;
        viewManager && Object.keys(viewManager).forEach(function (key) {
          var value = viewManager[key];
          if (typeof value === 'function') {
            commands[key] = index++;
          }
        });
        return commands;
      }
    });
  }
}
if (Platform.OS === 'ios') {
  Object.keys(_getConstants()).forEach(function (viewName) {
    lazifyViewManagerConfig(viewName);
  });
} else if (_getConstants().ViewManagerNames) {
  _NativeUIManager.default.getConstants().ViewManagerNames.forEach(function (viewManagerName) {
    defineLazyObjectProperty(_NativeUIManager.default, viewManagerName, {
      get: function get() {
        return _NativeUIManager.default.getConstantsForViewManager(viewManagerName);
      }
    });
  });
}
if (!global.nativeCallSyncHook) {
  Object.keys(_getConstants()).forEach(function (viewManagerName) {
    if (!UIManagerProperties.includes(viewManagerName)) {
      if (!viewManagerConfigs[viewManagerName]) {
        viewManagerConfigs[viewManagerName] = _getConstants()[viewManagerName];
      }
      defineLazyObjectProperty(_NativeUIManager.default, viewManagerName, {
        get: function get() {
          console.warn(`Accessing view manager configs directly off UIManager via UIManager['${viewManagerName}'] ` + `is no longer supported. Use UIManager.getViewManagerConfig('${viewManagerName}') instead.`);
          return UIManagerJS.getViewManagerConfig(viewManagerName);
        }
      });
    }
  });
}
module.exports = UIManagerJS;
//# sourceMappingURL=PaperUIManager.js.map