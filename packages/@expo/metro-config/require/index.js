/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork with bundle splitting and RSC support:
 * https://github.com/facebook/metro/blob/c84368021aa3123c221a49e269e2ef5afe4c663d/packages/metro-runtime/src/polyfills/require.js#L1
 */

// type ModuleList = Record<ModuleID, ModuleDefinition | null>;

global.__r = metroRequire;
global[`${__METRO_GLOBAL_PREFIX__}__d`] = define;
global.__c = clear;
global.__registerSegment = registerSegment;
var modules = clear();

// Don't use a Symbol here, it would pull in an extra polyfill with all sorts of
// additional stuff (e.g. Array.from).
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
  modules = new Map();
  //   modules = Object.create(null);

  // We return modules here so that we can assign an initial value to modules
  // when defining it. Otherwise, we would have to do "let modules = null",
  // which will force us to add "nullthrows" everywhere.
  return modules;
}
if (__DEV__) {
  //   var verboseNamesToModuleIds: Record<string, number> = Object.create(null);
  var initializingModuleIds = [];
}
function define(factory, moduleId, dependencyMap) {
  if (modules.get(moduleId) != null) {
    if (__DEV__) {
      // (We take `inverseDependencies` from `arguments` to avoid an unused
      // named parameter in `define` in production.
      var inverseDependencies = arguments[4];

      // If the module has already been defined and the define method has been
      // called with inverseDependencies, we can hot reload it.
      if (inverseDependencies) {
        global.__accept(moduleId, factory, dependencyMap, inverseDependencies);
      }
    }

    // prevent repeated calls to `global.nativeRequire` to overwrite modules
    // that are already loaded
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
  modules.set(moduleId, mod);
  if (__DEV__) {
    // HMR
    mod.hot = createHotReloadingObject();

    // DEBUGGABLE MODULES NAMES
    // we take `verboseName` from `arguments` to avoid an unused named parameter
    // in `define` in production.
    var verboseName = arguments[3];
    if (verboseName) {
      mod.verboseName = verboseName;
      //   verboseNamesToModuleIds[verboseName] = moduleId;
    }
  }
}
function metroRequire(moduleId) {
  //   if (__DEV__ && typeof moduleId === 'string') {
  //     const verboseName = moduleId;
  //     // moduleId = verboseNamesToModuleIds[verboseName];
  //     if (moduleId == null) {
  //       throw new Error(`Unknown named module: "${verboseName}"`);
  //     } else {
  //       console.warn(
  //         `Requiring module "${verboseName}" by name is only supported for ` +
  //           'debugging purposes and will BREAK IN PRODUCTION!'
  //       );
  //     }
  //   }

  if (__DEV__) {
    var initializingIndex = initializingModuleIds.indexOf(moduleId);
    if (initializingIndex !== -1) {
      var cycle = initializingModuleIds.slice(initializingIndex).map(function (id) {
        var _modules$get$verboseN, _modules$get;
        return (_modules$get$verboseN = (_modules$get = modules.get(id)) == null ? void 0 : _modules$get.verboseName) != null ? _modules$get$verboseN : '[unknown]';
      });
      if (shouldPrintRequireCycle(cycle)) {
        cycle.push(cycle[0]); // We want to print A -> B -> A:

        console.warn(`Require cycle: ${cycle.join(' -> ')}\n\n` + 'Require cycles are allowed, but can result in uninitialized values. ' + 'Consider refactoring to remove the need for a cycle.');
      }
    }
  }
  var module = modules.get(moduleId);
  return module && module.isInitialized ? module.publicModule.exports : guardedLoadModule(moduleId, module);
}

// We print require cycles unless they match a pattern in the
// `requireCycleIgnorePatterns` configuration.
function shouldPrintRequireCycle(modules) {
  var regExps = eval(`${__METRO_GLOBAL_PREFIX__}__requireCycleIgnorePatterns`);
  //   const regExps = global[__METRO_GLOBAL_PREFIX__ + '__requireCycleIgnorePatterns'];
  if (!Array.isArray(regExps)) {
    return true;
  }
  var isIgnored = function isIgnored(module) {
    return module != null && regExps.some(function (regExp) {
      return regExp.test(module);
    });
  };

  // Print the cycle unless any part of it is ignored
  return modules.every(function (module) {
    return !isIgnored(module);
  });
}
function metroImportDefault(moduleId) {
  var _modules$get2;
  if (modules.has(moduleId) && ((_modules$get2 = modules.get(moduleId)) == null ? void 0 : _modules$get2.importedDefault) !== EMPTY) {
    return modules.get(moduleId).importedDefault;
  }
  var exports = metroRequire(moduleId);
  var importedDefault = exports && exports.__esModule ? exports.default : exports;
  return modules.get(moduleId).importedDefault = importedDefault;
}
metroRequire.importDefault = metroImportDefault;
function metroImportAll(moduleId) {
  var _modules$get3;
  if (modules.has(moduleId) && ((_modules$get3 = modules.get(moduleId)) == null ? void 0 : _modules$get3.importedAll) !== EMPTY) {
    return modules.get(moduleId).importedAll;
  }
  var exports = metroRequire(moduleId);
  var importedAll;
  if (exports && exports.__esModule) {
    importedAll = exports;
  } else {
    importedAll = {};

    // Refrain from using Object.assign, it has to work in ES3 environments.
    if (exports) {
      for (var key in exports) {
        if (hasOwnProperty.call(exports, key)) {
          importedAll[key] = exports[key];
        }
      }
    }
    importedAll.default = exports;
  }

  // $FlowFixMe The metroRequire call above will throw if modules.get(id) is null
  return modules.get(moduleId).importedAll = importedAll;
}
metroRequire.importAll = metroImportAll;

// The `require.context()` syntax is never executed in the runtime because it is converted
// to `require()` in `metro/src/ModuleGraph/worker/collectDependencies.js` after collecting
// dependencies. If the feature flag is not enabled then the conversion never takes place and this error is thrown (development only).
metroRequire.context = function fallbackRequireContext() {
  if (__DEV__) {
    throw new Error('The experimental Metro feature `require.context` is not enabled in your project.\nThis can be enabled by setting the `transformer.unstable_allowRequireContext` property to `true` in your Metro configuration.');
  }
  throw new Error('The experimental Metro feature `require.context` is not enabled in your project.');
};

// `require.resolveWeak()` is a compile-time primitive (see collectDependencies.js)
metroRequire.resolveWeak = function fallbackRequireResolveWeak() {
  if (__DEV__) {
    throw new Error('require.resolveWeak cannot be called dynamically. Ensure you are using the same version of `metro` and `metro-runtime`.');
  }
  throw new Error('require.resolveWeak cannot be called dynamically.');
};

// Same as metroRequire but without the confusing error behavior. If the module import throws an error, it will be thrown normally.
metroRequire.unguarded = function requireUnguarded(moduleId) {
  if (__DEV__) {
    var initializingIndex = initializingModuleIds.indexOf(moduleId);
    if (initializingIndex !== -1) {
      var cycle = initializingModuleIds.slice(initializingIndex).map(function (id) {
        var _modules$get$verboseN2, _modules$get4;
        return (_modules$get$verboseN2 = (_modules$get4 = modules.get(id)) == null ? void 0 : _modules$get4.verboseName) != null ? _modules$get$verboseN2 : '[unknown]';
      });
      if (shouldPrintRequireCycle(cycle)) {
        cycle.push(cycle[0]); // We want to print A -> B -> A:

        console.warn(`Require cycle: ${cycle.join(' -> ')}\n\n` + 'Require cycles are allowed, but can result in uninitialized values. ' + 'Consider refactoring to remove the need for a cycle.');
      }
    }
  }
  var module = modules.get(moduleId);
  return module && module.isInitialized ? module.publicModule.exports : loadModuleImplementation(moduleId, module);
};
var inGuard = false;
function guardedLoadModule(moduleId, module) {
  if (!inGuard && global.ErrorUtils) {
    inGuard = true;
    var returnValue;
    try {
      returnValue = loadModuleImplementation(moduleId, module);
    } catch (e) {
      // TODO: (moti) T48204692 Type this use of ErrorUtils.
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
      throw new Error('registerSegment: Expected moduleIds to be null for main segment');
    }
    if (segmentId !== 0 && !moduleIds) {
      throw new Error('registerSegment: Expected moduleIds to be passed for segment #' + segmentId);
    }
  }
  if (moduleIds) {
    moduleIds.forEach(function (moduleId) {
      if (!modules.has(moduleId) && !definingSegmentByModuleID.has(moduleId)) {
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
      module = modules.get(moduleId);
      definingSegmentByModuleID.delete(moduleId);
    }
  }

  // NOTE(EvanBacon): Removing support for nativeRequire because it's unclear how it's used.
  //   const nativeRequire = global.nativeRequire;
  //   if (!module && nativeRequire) {
  //     const { segmentId, localId } = unpackModuleId(moduleId);
  //     nativeRequire(localId, segmentId);
  //     module = modules.get(moduleId);
  //   }

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

  // We must optimistically mark module as initialized before running the
  // factory to keep any require cycles inside the factory from causing an
  // infinite require loop.
  module.isInitialized = true;
  var _module = module,
    factory = _module.factory,
    dependencyMap = _module.dependencyMap;
  if (__DEV__) {
    initializingModuleIds.push(moduleId);
  }
  try {
    if (__DEV__) {
      // $FlowIgnore: we know that __DEV__ is const and `Systrace` exists
      Systrace.beginEvent('JS_require_' + (module.verboseName || moduleId));
    }
    var moduleObject = module.publicModule;
    if (__DEV__) {
      moduleObject.hot = module.hot;
      var prevRefreshReg = global.$RefreshReg$;
      var prevRefreshSig = global.$RefreshSig$;
      if (Refresh != null) {
        var RefreshRuntime = Refresh;
        global.$RefreshReg$ = function (type, id) {
          RefreshRuntime.register(type, moduleId + ' ' + id);
        };
        global.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
      }
    }
    moduleObject.id = moduleId;

    // keep args in sync with with defineModuleCode in
    // metro/src/Resolver/index.js
    // and metro/src/ModuleGraph/worker.js
    factory(global, metroRequire, metroImportDefault, metroImportAll, moduleObject, moduleObject.exports, dependencyMap);

    // avoid removing factory in DEV mode as it breaks HMR
    if (!__DEV__) {
      // @ts-expect-error: This is only sound because we never access `factory` again
      module.factory = undefined;
      module.dependencyMap = undefined;
    }
    if (__DEV__) {
      // $FlowIgnore: we know that __DEV__ is const and `Systrace` exists
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
        throw new Error('initializingModuleIds is corrupt; something is terribly wrong');
      }
      global.$RefreshReg$ = prevRefreshReg;
      global.$RefreshSig$ = prevRefreshSig;
    }
  }
}
function unknownModuleError(id) {
  var message = 'Requiring unknown module "' + id + '".';
  if (__DEV__) {
    message += ' If you are sure the module exists, try restarting Metro. ' + 'You may also want to run `yarn` or `npm install`.';
  }
  return Error(message);
}

// NOTE(EvanBacon): We expose this in Expo for chunk loading.
metroRequire.getModules = function () {
  return modules;
};
if (__DEV__) {
  // $FlowFixMe[prop-missing]
  metroRequire.Systrace = {
    beginEvent: function beginEvent() {},
    endEvent: function endEvent() {}
  };

  // HOT MODULE RELOADING
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
    var mod = modules.get(id);
    if (!mod) {
      if (factory) {
        // New modules are going to be handled by the define() method.
        return;
      }
      throw unknownModuleError(id);
    }
    if (!mod.hasError && !mod.isInitialized) {
      // The module hasn't actually been executed yet,
      // so we can always safely replace it.
      mod.factory = factory;
      mod.dependencyMap = dependencyMap;
      return;
    }
    var Refresh = requireRefresh();
    var refreshBoundaryIDs = new Set();

    // In this loop, we will traverse the dependency tree upwards from the
    // changed module. Updates "bubble" up to the closest accepted parent.
    //
    // If we reach the module root and nothing along the way accepted the update,
    // we know hot reload is going to fail. In that case we return false.
    //
    // The main purpose of this loop is to figure out whether it's safe to apply
    // a hot update. It is only safe when the update was accepted somewhere
    // along the way upwards for each of its parent dependency module chains.
    //
    // We perform a topological sort because we may discover the same
    // module more than once in the list of things to re-execute, and
    // we want to execute modules before modules that depend on them.
    //
    // If we didn't have this check, we'd risk re-evaluating modules that
    // have side effects and lead to confusing and meaningless crashes.

    var didBailOut = false;
    var updatedModuleIDs;
    try {
      updatedModuleIDs = topologicalSort([id],
      // Start with the changed module and go upwards
      function (pendingID) {
        var pendingModule = modules.get(pendingID);
        if (pendingModule == null) {
          // Nothing to do.
          return [];
        }
        var pendingHot = pendingModule.hot;
        if (pendingHot == null) {
          throw new Error('[Refresh] Expected module.hot to always exist in DEV.');
        }
        // A module can be accepted manually from within itself.
        var canAccept = pendingHot._didAccept;
        if (!canAccept && Refresh != null) {
          // Or React Refresh may mark it accepted based on exports.
          var isBoundary = isReactRefreshBoundary(Refresh, pendingModule.publicModule.exports);
          if (isBoundary) {
            canAccept = true;
            refreshBoundaryIDs.add(pendingID);
          }
        }
        if (canAccept) {
          // Don't look at parents.
          return [];
        }
        // If we bubble through the roof, there is no way to do a hot update.
        // Bail out altogether. This is the failure case.
        var parentIDs = inverseDependencies[pendingID];
        if (parentIDs.length === 0) {
          // Reload the app because the hot reload can't succeed.
          // This should work both on web and React Native.
          performFullRefresh('No root boundary', {
            source: mod,
            failed: pendingModule
          });
          didBailOut = true;
          return [];
        }
        // This module can't handle the update but maybe all its parents can?
        // Put them all in the queue to run the same set of checks.
        return parentIDs;
      }, function () {
        return didBailOut;
      } // Should we stop?
      ).reverse();
    } catch (e) {
      if (e === CYCLE_DETECTED) {
        performFullRefresh('Dependency cycle', {
          source: mod
        });
        return;
      }
      throw e;
    }
    if (didBailOut) {
      return;
    }

    // If we reached here, it is likely that hot reload will be successful.
    // Run the actual factories.
    var seenModuleIDs = new Set();
    for (var i = 0; i < updatedModuleIDs.length; i++) {
      var updatedID = updatedModuleIDs[i];
      if (seenModuleIDs.has(updatedID)) {
        continue;
      }
      seenModuleIDs.add(updatedID);
      var updatedMod = modules.get(updatedID);
      if (updatedMod == null) {
        throw new Error('[Refresh] Expected to find the updated module.');
      }
      var prevExports = updatedMod.publicModule.exports;
      var didError = runUpdatedModule(updatedID, updatedID === id ? factory : undefined, updatedID === id ? dependencyMap : undefined);
      var nextExports = updatedMod.publicModule.exports;
      if (didError) {
        // The user was shown a redbox about module initialization.
        // There's nothing for us to do here until it's fixed.
        return;
      }
      if (refreshBoundaryIDs.has(updatedID)) {
        // Since we just executed the code for it, it's possible
        // that the new exports make it ineligible for being a boundary.
        var isNoLongerABoundary = !isReactRefreshBoundary(Refresh, nextExports);
        // It can also become ineligible if its exports are incompatible
        // with the previous exports.
        // For example, if you add/remove/change exports, we'll want
        // to re-execute the importing modules, and force those components
        // to re-render. Similarly, if you convert a class component
        // to a function, we want to invalidate the boundary.
        var didInvalidate = shouldInvalidateReactRefreshBoundary(Refresh, prevExports, nextExports);
        if (isNoLongerABoundary || didInvalidate) {
          // We'll be conservative. The only case in which we won't do a full
          // reload is if all parent modules are also refresh boundaries.
          // In that case we'll add them to the current queue.
          var parentIDs = inverseDependencies[updatedID];
          if (parentIDs.length === 0) {
            // Looks like we bubbled to the root. Can't recover from that.
            performFullRefresh(isNoLongerABoundary ? 'No longer a boundary' : 'Invalidated boundary', {
              source: mod,
              failed: updatedMod
            });
            return;
          }
          // Schedule all parent refresh boundaries to re-run in this loop.
          for (var j = 0; j < parentIDs.length; j++) {
            var parentID = parentIDs[j];
            var parentMod = modules.get(parentID);
            if (parentMod == null) {
              throw new Error('[Refresh] Expected to find parent module.');
            }
            var canAcceptParent = isReactRefreshBoundary(Refresh, parentMod.publicModule.exports);
            if (canAcceptParent) {
              // All parents will have to re-run too.
              refreshBoundaryIDs.add(parentID);
              updatedModuleIDs.push(parentID);
            } else {
              performFullRefresh('Invalidated boundary', {
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
      // Debounce a little in case there are multiple updates queued up.
      // This is also useful because __accept may be called multiple times.
      if (reactRefreshTimeout == null) {
        reactRefreshTimeout = setTimeout(function () {
          reactRefreshTimeout = null;
          // Update React components.
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
    var mod = modules.get(id);
    if (mod == null) {
      throw new Error('[Refresh] Expected to find the module.');
    }
    var hot = mod.hot;
    if (!hot) {
      throw new Error('[Refresh] Expected module.hot to always exist in DEV.');
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
      // This error has already been reported via a redbox.
      // We know it's likely a typo or some mistake that was just introduced.
      // Our goal now is to keep the rest of the application working so that by
      // the time user fixes the error, the app isn't completely destroyed
      // underneath the redbox. So we'll revert the module object to the last
      // successful export and stop propagating this update.
      mod.hasError = false;
      mod.isInitialized = true;
      mod.error = null;
      mod.publicModule.exports = prevExports;
      // We errored. Stop the update.
      return true;
    }
    if (hot._acceptCallback) {
      try {
        hot._acceptCallback();
      } catch (error) {
        console.error(`Error while calling accept handler for module ${id}: `, error);
      }
    }
    // No error.
    return false;
  };
  var performFullRefresh = function performFullRefresh(reason, modules) {
    /* global window */
    if (typeof window !== 'undefined' && window.location != null && typeof window.location.reload === 'function') {
      window.location.reload();
    } else {
      var Refresh = requireRefresh();
      if (Refresh != null) {
        var _modules$source$verbo, _modules$source, _modules$failed$verbo, _modules$failed;
        var sourceName = (_modules$source$verbo = (_modules$source = modules.source) == null ? void 0 : _modules$source.verboseName) != null ? _modules$source$verbo : 'unknown';
        var failedName = (_modules$failed$verbo = (_modules$failed = modules.failed) == null ? void 0 : _modules$failed.verboseName) != null ? _modules$failed$verbo : 'unknown';
        Refresh.performFullRefresh(`Fast Refresh - ${reason} <${sourceName}> <${failedName}>`);
      } else {
        console.warn('Could not reload the application after an edit.');
      }
    }
  };

  // Modules that only export components become React Refresh boundaries.
  var isReactRefreshBoundary = function isReactRefreshBoundary(Refresh, moduleExports) {
    if (Refresh.isLikelyComponentType(moduleExports)) {
      return true;
    }
    if (moduleExports == null || typeof moduleExports !== 'object') {
      // Exit if we can't iterate over exports.
      return false;
    }
    var hasExports = false;
    var areAllExportsComponents = true;
    for (var key in moduleExports) {
      hasExports = true;
      if (key === '__esModule') {
        continue;
      }
      var desc = Object.getOwnPropertyDescriptor(moduleExports, key);
      if (desc && desc.get) {
        // Don't invoke getters as they may have side effects.
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

  // When this signature changes, it's unsafe to stop at this refresh boundary.
  var getRefreshBoundarySignature = function getRefreshBoundarySignature(Refresh, moduleExports) {
    var signature = [];
    signature.push(Refresh.getFamilyByType(moduleExports));
    if (moduleExports == null || typeof moduleExports !== 'object') {
      // Exit if we can't iterate over exports.
      // (This is important for legacy environments.)
      return signature;
    }
    for (var key in moduleExports) {
      if (key === '__esModule') {
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
    Refresh.register(moduleExports, moduleID + ' %exports%');
    if (moduleExports == null || typeof moduleExports !== 'object') {
      // Exit if we can't iterate over exports.
      // (This is important for legacy environments.)
      return;
    }
    for (var key in moduleExports) {
      var desc = Object.getOwnPropertyDescriptor(moduleExports, key);
      if (desc && desc.get) {
        // Don't invoke getters as they may have side effects.
        continue;
      }
      var exportValue = moduleExports[key];
      var typeID = moduleID + ' %exports% ' + key;
      Refresh.register(exportValue, typeID);
    }
  };
  global.__accept = metroHotUpdateModule;
}
if (__DEV__) {
  // The metro require polyfill can not have module dependencies.
  // The Systrace and ReactRefresh dependencies are, therefore, made publicly
  // available. Ideally, the dependency would be inversed in a way that
  // Systrace / ReactRefresh could integrate into Metro rather than
  // having to make them publicly available.

  var requireSystrace = function requireSystrace() {
    return global[__METRO_GLOBAL_PREFIX__ + '__SYSTRACE'] || metroRequire.Systrace;
  };
  var requireRefresh = function requireRefresh() {
    // @ts-expect-error
    return global[__METRO_GLOBAL_PREFIX__ + '__ReactRefresh'] || metroRequire.Refresh;
  };
}