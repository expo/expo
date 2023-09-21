"use strict";
global.__r = metroRequire;
global[`${__METRO_GLOBAL_PREFIX__}__d`] = define;
global.__c = clear;
global.__registerSegment = registerSegment;
var modules = clear();
var EMPTY = {};
var CYCLE_DETECTED = {};
var _ref = {},
  hasOwnProperty = _ref.hasOwnProperty;
if (__DEV__) {
  global.$RefreshReg$ = function () {};
  global.$RefreshSig$ = function () {
    return function (type) {
      return type;
    };
  };
}
function clear() {
  modules = Object.create(null);
  return modules;
}
if (__DEV__) {
  var verboseNamesToModuleIds = Object.create(null);
  var initializingModuleIds = [];
}
function define(factory, moduleId, dependencyMap) {
  if (modules[moduleId] != null) {
    if (__DEV__) {
      var inverseDependencies = arguments[4];
      if (inverseDependencies) {
        global.__accept(moduleId, factory, dependencyMap, inverseDependencies);
      }
    }
    return;
  }
  var mod = {
    dependencyMap: dependencyMap,
    factory: factory,
    hasError: false,
    importedAll: EMPTY,
    importedDefault: EMPTY,
    isInitialized: false,
    publicModule: {
      exports: {}
    }
  };
  modules[moduleId] = mod;
  if (__DEV__) {
    mod.hot = createHotReloadingObject();
    var verboseName = arguments[3];
    if (verboseName) {
      mod.verboseName = verboseName;
      verboseNamesToModuleIds[verboseName] = moduleId;
    }
  }
}
function metroRequire(moduleId) {
  if (__DEV__ && typeof moduleId === "string") {
    var verboseName = moduleId;
    moduleId = verboseNamesToModuleIds[verboseName];
    if (moduleId == null) {
      throw new Error(`Unknown named module: "${verboseName}"`);
    } else {
      console.warn(`Requiring module "${verboseName}" by name is only supported for ` + "debugging purposes and will BREAK IN PRODUCTION!");
    }
  }
  var moduleIdReallyIsNumber = moduleId;
  if (__DEV__) {
    var initializingIndex = initializingModuleIds.indexOf(moduleIdReallyIsNumber);
    if (initializingIndex !== -1) {
      var cycle = initializingModuleIds.slice(initializingIndex).map(function (id) {
        return modules[id] ? modules[id].verboseName : "[unknown]";
      });
      if (shouldPrintRequireCycle(cycle)) {
        cycle.push(cycle[0]);
        console.warn(`Require cycle: ${cycle.join(" -> ")}\n\n` + "Require cycles are allowed, but can result in uninitialized values. " + "Consider refactoring to remove the need for a cycle.");
      }
    }
  }
  var module = modules[moduleIdReallyIsNumber];
  return module && module.isInitialized ? module.publicModule.exports : guardedLoadModule(moduleIdReallyIsNumber, module);
}
function shouldPrintRequireCycle(modules) {
  var regExps = global[__METRO_GLOBAL_PREFIX__ + "__requireCycleIgnorePatterns"];
  if (!Array.isArray(regExps)) {
    return true;
  }
  var isIgnored = function isIgnored(module) {
    return module != null && regExps.some(function (regExp) {
      return regExp.test(module);
    });
  };
  return modules.every(function (module) {
    return !isIgnored(module);
  });
}
function metroImportDefault(moduleId) {
  if (__DEV__ && typeof moduleId === "string") {
    var verboseName = moduleId;
    moduleId = verboseNamesToModuleIds[verboseName];
  }
  var moduleIdReallyIsNumber = moduleId;
  if (modules[moduleIdReallyIsNumber] && modules[moduleIdReallyIsNumber].importedDefault !== EMPTY) {
    return modules[moduleIdReallyIsNumber].importedDefault;
  }
  var exports = metroRequire(moduleIdReallyIsNumber);
  var importedDefault = exports && exports.__esModule ? exports.default : exports;
  return modules[moduleIdReallyIsNumber].importedDefault = importedDefault;
}
metroRequire.importDefault = metroImportDefault;
function metroImportAll(moduleId) {
  if (__DEV__ && typeof moduleId === "string") {
    var verboseName = moduleId;
    moduleId = verboseNamesToModuleIds[verboseName];
  }
  var moduleIdReallyIsNumber = moduleId;
  if (modules[moduleIdReallyIsNumber] && modules[moduleIdReallyIsNumber].importedAll !== EMPTY) {
    return modules[moduleIdReallyIsNumber].importedAll;
  }
  var exports = metroRequire(moduleIdReallyIsNumber);
  var importedAll;
  if (exports && exports.__esModule) {
    importedAll = exports;
  } else {
    importedAll = {};
    if (exports) {
      for (var key in exports) {
        if (hasOwnProperty.call(exports, key)) {
          importedAll[key] = exports[key];
        }
      }
    }
    importedAll.default = exports;
  }
  return modules[moduleIdReallyIsNumber].importedAll = importedAll;
}
metroRequire.importAll = metroImportAll;
metroRequire.context = function fallbackRequireContext() {
  if (__DEV__) {
    throw new Error("The experimental Metro feature `require.context` is not enabled in your project.\nThis can be enabled by setting the `transformer.unstable_allowRequireContext` property to `true` in your Metro configuration.");
  }
  throw new Error("The experimental Metro feature `require.context` is not enabled in your project.");
};
metroRequire.resolveWeak = function fallbackRequireResolveWeak() {
  if (__DEV__) {
    throw new Error("require.resolveWeak cannot be called dynamically. Ensure you are using the same version of `metro` and `metro-runtime`.");
  }
  throw new Error("require.resolveWeak cannot be called dynamically.");
};
var inGuard = false;
function guardedLoadModule(moduleId, module) {
  if (!inGuard && global.ErrorUtils) {
    inGuard = true;
    var returnValue;
    try {
      returnValue = loadModuleImplementation(moduleId, module);
    } catch (e) {
      global.ErrorUtils.reportFatalError(e);
    }
    inGuard = false;
    return returnValue;
  } else {
    return loadModuleImplementation(moduleId, module);
  }
}
var ID_MASK_SHIFT = 16;
var LOCAL_ID_MASK = ~0 >>> ID_MASK_SHIFT;
function unpackModuleId(moduleId) {
  var segmentId = moduleId >>> ID_MASK_SHIFT;
  var localId = moduleId & LOCAL_ID_MASK;
  return {
    segmentId: segmentId,
    localId: localId
  };
}
metroRequire.unpackModuleId = unpackModuleId;
function packModuleId(value) {
  return (value.segmentId << ID_MASK_SHIFT) + value.localId;
}
metroRequire.packModuleId = packModuleId;
var moduleDefinersBySegmentID = [];
var definingSegmentByModuleID = new Map();
function registerSegment(segmentId, moduleDefiner, moduleIds) {
  moduleDefinersBySegmentID[segmentId] = moduleDefiner;
  if (__DEV__) {
    if (segmentId === 0 && moduleIds) {
      throw new Error("registerSegment: Expected moduleIds to be null for main segment");
    }
    if (segmentId !== 0 && !moduleIds) {
      throw new Error("registerSegment: Expected moduleIds to be passed for segment #" + segmentId);
    }
  }
  if (moduleIds) {
    moduleIds.forEach(function (moduleId) {
      if (!modules[moduleId] && !definingSegmentByModuleID.has(moduleId)) {
        definingSegmentByModuleID.set(moduleId, segmentId);
      }
    });
  }
}
function loadModuleImplementation(moduleId, module) {
  if (!module && moduleDefinersBySegmentID.length > 0) {
    var _definingSegmentByMod;
    var segmentId = (_definingSegmentByMod = definingSegmentByModuleID.get(moduleId)) != null ? _definingSegmentByMod : 0;
    var definer = moduleDefinersBySegmentID[segmentId];
    if (definer != null) {
      definer(moduleId);
      module = modules[moduleId];
      definingSegmentByModuleID.delete(moduleId);
    }
  }
  var nativeRequire = global.nativeRequire;
  if (!module && nativeRequire) {
    var _unpackModuleId = unpackModuleId(moduleId),
      _segmentId = _unpackModuleId.segmentId,
      localId = _unpackModuleId.localId;
    nativeRequire(localId, _segmentId);
    module = modules[moduleId];
  }
  if (!module) {
    throw unknownModuleError(moduleId);
  }
  if (module.hasError) {
    throw module.error;
  }
  if (__DEV__) {
    var Systrace = requireSystrace();
    var Refresh = requireRefresh();
  }
  module.isInitialized = true;
  var _module = module,
    factory = _module.factory,
    dependencyMap = _module.dependencyMap;
  if (__DEV__) {
    initializingModuleIds.push(moduleId);
  }
  try {
    if (__DEV__) {
      Systrace.beginEvent("JS_require_" + (module.verboseName || moduleId));
    }
    var moduleObject = module.publicModule;
    if (__DEV__) {
      moduleObject.hot = module.hot;
      var prevRefreshReg = global.$RefreshReg$;
      var prevRefreshSig = global.$RefreshSig$;
      if (Refresh != null) {
        var RefreshRuntime = Refresh;
        global.$RefreshReg$ = function (type, id) {
          RefreshRuntime.register(type, moduleId + " " + id);
        };
        global.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
      }
    }
    moduleObject.id = moduleId;
    factory(global, metroRequire, metroImportDefault, metroImportAll, moduleObject, moduleObject.exports, dependencyMap);
    if (!__DEV__) {
      module.factory = undefined;
      module.dependencyMap = undefined;
    }
    if (__DEV__) {
      Systrace.endEvent();
      if (Refresh != null) {
        registerExportsForReactRefresh(Refresh, moduleObject.exports, moduleId);
      }
    }
    return moduleObject.exports;
  } catch (e) {
    module.hasError = true;
    module.error = e;
    module.isInitialized = false;
    module.publicModule.exports = undefined;
    throw e;
  } finally {
    if (__DEV__) {
      if (initializingModuleIds.pop() !== moduleId) {
        throw new Error("initializingModuleIds is corrupt; something is terribly wrong");
      }
      global.$RefreshReg$ = prevRefreshReg;
      global.$RefreshSig$ = prevRefreshSig;
    }
  }
}
function unknownModuleError(id) {
  var message = 'Requiring unknown module "' + id + '".';
  if (__DEV__) {
    message += " If you are sure the module exists, try restarting Metro. " + "You may also want to run `yarn` or `npm install`.";
  }
  return Error(message);
}
if (__DEV__) {
  metroRequire.Systrace = {
    beginEvent: function beginEvent() {},
    endEvent: function endEvent() {}
  };
  metroRequire.getModules = function () {
    return modules;
  };
  var createHotReloadingObject = function createHotReloadingObject() {
    var hot = {
      _acceptCallback: null,
      _disposeCallback: null,
      _didAccept: false,
      accept: function accept(callback) {
        hot._didAccept = true;
        hot._acceptCallback = callback;
      },
      dispose: function dispose(callback) {
        hot._disposeCallback = callback;
      }
    };
    return hot;
  };
  var reactRefreshTimeout = null;
  var metroHotUpdateModule = function metroHotUpdateModule(id, factory, dependencyMap, inverseDependencies) {
    var mod = modules[id];
    if (!mod) {
      if (factory) {
        return;
      }
      throw unknownModuleError(id);
    }
    if (!mod.hasError && !mod.isInitialized) {
      mod.factory = factory;
      mod.dependencyMap = dependencyMap;
      return;
    }
    var Refresh = requireRefresh();
    var refreshBoundaryIDs = new Set();
    var didBailOut = false;
    var updatedModuleIDs;
    try {
      updatedModuleIDs = topologicalSort([id], function (pendingID) {
        var pendingModule = modules[pendingID];
        if (pendingModule == null) {
          return [];
        }
        var pendingHot = pendingModule.hot;
        if (pendingHot == null) {
          throw new Error("[Refresh] Expected module.hot to always exist in DEV.");
        }
        var canAccept = pendingHot._didAccept;
        if (!canAccept && Refresh != null) {
          var isBoundary = isReactRefreshBoundary(Refresh, pendingModule.publicModule.exports);
          if (isBoundary) {
            canAccept = true;
            refreshBoundaryIDs.add(pendingID);
          }
        }
        if (canAccept) {
          return [];
        }
        var parentIDs = inverseDependencies[pendingID];
        if (parentIDs.length === 0) {
          performFullRefresh("No root boundary", {
            source: mod,
            failed: pendingModule
          });
          didBailOut = true;
          return [];
        }
        return parentIDs;
      }, function () {
        return didBailOut;
      }).reverse();
    } catch (e) {
      if (e === CYCLE_DETECTED) {
        performFullRefresh("Dependency cycle", {
          source: mod
        });
        return;
      }
      throw e;
    }
    if (didBailOut) {
      return;
    }
    var seenModuleIDs = new Set();
    for (var i = 0; i < updatedModuleIDs.length; i++) {
      var updatedID = updatedModuleIDs[i];
      if (seenModuleIDs.has(updatedID)) {
        continue;
      }
      seenModuleIDs.add(updatedID);
      var updatedMod = modules[updatedID];
      if (updatedMod == null) {
        throw new Error("[Refresh] Expected to find the updated module.");
      }
      var prevExports = updatedMod.publicModule.exports;
      var didError = runUpdatedModule(updatedID, updatedID === id ? factory : undefined, updatedID === id ? dependencyMap : undefined);
      var nextExports = updatedMod.publicModule.exports;
      if (didError) {
        return;
      }
      if (refreshBoundaryIDs.has(updatedID)) {
        var isNoLongerABoundary = !isReactRefreshBoundary(Refresh, nextExports);
        var didInvalidate = shouldInvalidateReactRefreshBoundary(Refresh, prevExports, nextExports);
        if (isNoLongerABoundary || didInvalidate) {
          var parentIDs = inverseDependencies[updatedID];
          if (parentIDs.length === 0) {
            performFullRefresh(isNoLongerABoundary ? "No longer a boundary" : "Invalidated boundary", {
              source: mod,
              failed: updatedMod
            });
            return;
          }
          for (var j = 0; j < parentIDs.length; j++) {
            var parentID = parentIDs[j];
            var parentMod = modules[parentID];
            if (parentMod == null) {
              throw new Error("[Refresh] Expected to find parent module.");
            }
            var canAcceptParent = isReactRefreshBoundary(Refresh, parentMod.publicModule.exports);
            if (canAcceptParent) {
              refreshBoundaryIDs.add(parentID);
              updatedModuleIDs.push(parentID);
            } else {
              performFullRefresh("Invalidated boundary", {
                source: mod,
                failed: parentMod
              });
              return;
            }
          }
        }
      }
    }
    if (Refresh != null) {
      if (reactRefreshTimeout == null) {
        reactRefreshTimeout = setTimeout(function () {
          reactRefreshTimeout = null;
          Refresh.performReactRefresh();
        }, 30);
      }
    }
  };
  var topologicalSort = function topologicalSort(roots, getEdges, earlyStop) {
    var result = [];
    var visited = new Set();
    var stack = new Set();
    function traverseDependentNodes(node) {
      if (stack.has(node)) {
        throw CYCLE_DETECTED;
      }
      if (visited.has(node)) {
        return;
      }
      visited.add(node);
      stack.add(node);
      var dependentNodes = getEdges(node);
      if (earlyStop(node)) {
        stack.delete(node);
        return;
      }
      dependentNodes.forEach(function (dependent) {
        traverseDependentNodes(dependent);
      });
      stack.delete(node);
      result.push(node);
    }
    roots.forEach(function (root) {
      traverseDependentNodes(root);
    });
    return result;
  };
  var runUpdatedModule = function runUpdatedModule(id, factory, dependencyMap) {
    var mod = modules[id];
    if (mod == null) {
      throw new Error("[Refresh] Expected to find the module.");
    }
    var hot = mod.hot;
    if (!hot) {
      throw new Error("[Refresh] Expected module.hot to always exist in DEV.");
    }
    if (hot._disposeCallback) {
      try {
        hot._disposeCallback();
      } catch (error) {
        console.error(`Error while calling dispose handler for module ${id}: `, error);
      }
    }
    if (factory) {
      mod.factory = factory;
    }
    if (dependencyMap) {
      mod.dependencyMap = dependencyMap;
    }
    mod.hasError = false;
    mod.error = undefined;
    mod.importedAll = EMPTY;
    mod.importedDefault = EMPTY;
    mod.isInitialized = false;
    var prevExports = mod.publicModule.exports;
    mod.publicModule.exports = {};
    hot._didAccept = false;
    hot._acceptCallback = null;
    hot._disposeCallback = null;
    metroRequire(id);
    if (mod.hasError) {
      mod.hasError = false;
      mod.isInitialized = true;
      mod.error = null;
      mod.publicModule.exports = prevExports;
      return true;
    }
    if (hot._acceptCallback) {
      try {
        hot._acceptCallback();
      } catch (error) {
        console.error(`Error while calling accept handler for module ${id}: `, error);
      }
    }
    return false;
  };
  var performFullRefresh = function performFullRefresh(reason, modules) {
    if (typeof window !== "undefined" && window.location != null && typeof window.location.reload === "function") {
      window.location.reload();
    } else {
      var Refresh = requireRefresh();
      if (Refresh != null) {
        var _modules$source$verbo, _modules$source, _modules$failed$verbo, _modules$failed;
        var sourceName = (_modules$source$verbo = (_modules$source = modules.source) == null ? void 0 : _modules$source.verboseName) != null ? _modules$source$verbo : "unknown";
        var failedName = (_modules$failed$verbo = (_modules$failed = modules.failed) == null ? void 0 : _modules$failed.verboseName) != null ? _modules$failed$verbo : "unknown";
        Refresh.performFullRefresh(`Fast Refresh - ${reason} <${sourceName}> <${failedName}>`);
      } else {
        console.warn("Could not reload the application after an edit.");
      }
    }
  };
  var isReactRefreshBoundary = function isReactRefreshBoundary(Refresh, moduleExports) {
    if (Refresh.isLikelyComponentType(moduleExports)) {
      return true;
    }
    if (moduleExports == null || typeof moduleExports !== "object") {
      return false;
    }
    var hasExports = false;
    var areAllExportsComponents = true;
    for (var key in moduleExports) {
      hasExports = true;
      if (key === "__esModule") {
        continue;
      }
      var desc = Object.getOwnPropertyDescriptor(moduleExports, key);
      if (desc && desc.get) {
        return false;
      }
      var exportValue = moduleExports[key];
      if (!Refresh.isLikelyComponentType(exportValue)) {
        areAllExportsComponents = false;
      }
    }
    return hasExports && areAllExportsComponents;
  };
  var shouldInvalidateReactRefreshBoundary = function shouldInvalidateReactRefreshBoundary(Refresh, prevExports, nextExports) {
    var prevSignature = getRefreshBoundarySignature(Refresh, prevExports);
    var nextSignature = getRefreshBoundarySignature(Refresh, nextExports);
    if (prevSignature.length !== nextSignature.length) {
      return true;
    }
    for (var i = 0; i < nextSignature.length; i++) {
      if (prevSignature[i] !== nextSignature[i]) {
        return true;
      }
    }
    return false;
  };
  var getRefreshBoundarySignature = function getRefreshBoundarySignature(Refresh, moduleExports) {
    var signature = [];
    signature.push(Refresh.getFamilyByType(moduleExports));
    if (moduleExports == null || typeof moduleExports !== "object") {
      return signature;
    }
    for (var key in moduleExports) {
      if (key === "__esModule") {
        continue;
      }
      var desc = Object.getOwnPropertyDescriptor(moduleExports, key);
      if (desc && desc.get) {
        continue;
      }
      var exportValue = moduleExports[key];
      signature.push(key);
      signature.push(Refresh.getFamilyByType(exportValue));
    }
    return signature;
  };
  var registerExportsForReactRefresh = function registerExportsForReactRefresh(Refresh, moduleExports, moduleID) {
    Refresh.register(moduleExports, moduleID + " %exports%");
    if (moduleExports == null || typeof moduleExports !== "object") {
      return;
    }
    for (var key in moduleExports) {
      var desc = Object.getOwnPropertyDescriptor(moduleExports, key);
      if (desc && desc.get) {
        continue;
      }
      var exportValue = moduleExports[key];
      var typeID = moduleID + " %exports% " + key;
      Refresh.register(exportValue, typeID);
    }
  };
  global.__accept = metroHotUpdateModule;
}
if (__DEV__) {
  var requireSystrace = function requireSystrace() {
    return global[__METRO_GLOBAL_PREFIX__ + "__SYSTRACE"] || metroRequire.Systrace;
  };
  var requireRefresh = function requireRefresh() {
    return global[__METRO_GLOBAL_PREFIX__ + "__ReactRefresh"] || metroRequire.Refresh;
  };
}