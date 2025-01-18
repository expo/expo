/* eslint-disable no-var */
/**
 * Copyright © 2024 650 Industries.
 * Copyright © Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Universal require runtime based on:
 * https://github.com/facebook/metro/blob/ebd40efa3bd3363930ffe21120714a4d9e0b7bac/packages/metro-runtime/src/polyfills/require.js#L1
 */
'use strict';

declare let global: {
  ErrorUtils?: {
    reportFatalError(e: unknown): void;
  };
  $RefreshReg$?: (type: any, id: string) => void;
  $RefreshSig$?: () => (type: any) => any;
  __r: RequireFn;
  [key: string]: any;
};
declare let window: any;
declare let __DEV__: boolean;
declare let __METRO_GLOBAL_PREFIX__: string;

interface ArrayIndexable<T> {
  readonly [index: number]: T;
}

interface DependencyMap extends ArrayIndexable<ModuleID> {
  paths?: Record<ModuleID, string>;
}

interface InverseDependencyMap {
  [key: string]: ModuleID[];
}

type Exports = any;

interface FactoryFn {
  (
    global: any,
    require: RequireFn,
    metroImportDefault: RequireFn,
    metroImportAll: RequireFn,
    moduleObject: Module,
    exports: any,
    dependencyMap?: DependencyMap
  ): void;
}

type HotModuleReloadingCallback = () => void;

interface HotModuleReloadingData {
  _acceptCallback?: HotModuleReloadingCallback | null;
  _disposeCallback?: HotModuleReloadingCallback | null;
  _didAccept: boolean;
  accept(callback?: HotModuleReloadingCallback): void;
  dispose(callback?: HotModuleReloadingCallback): void;
}

type ModuleID = string | number;

interface Module {
  id?: ModuleID;
  exports: Exports;
  hot?: HotModuleReloadingData;
}

interface ModuleDefinition {
  dependencyMap?: DependencyMap;
  error?: any;
  factory?: FactoryFn;
  hasError: boolean;
  hot?: HotModuleReloadingData;
  importedAll: any;
  importedDefault: any;
  isInitialized: boolean;
  path?: string;
  publicModule: Module;
  verboseName?: string;
}

type ModuleList = Map<ModuleID, ModuleDefinition | null>;

export type RequireFn = (id: ModuleID | VerboseModuleNameForDev) => Exports;

export type DefineFn = (
  factory: FactoryFn,
  moduleId: number,
  dependencyMap?: DependencyMap,
  verboseName?: string,
  inverseDependencies?: InverseDependencyMap
) => void;

type VerboseModuleNameForDev = string;
type ModuleDefiner = (moduleId: ModuleID) => void;

global.__r = metroRequire as RequireFn;
global[`${__METRO_GLOBAL_PREFIX__}__d`] = define as DefineFn;
global.__c = clear;
global.__registerSegment = registerSegment;

var modules = clear();

// Don't use a Symbol here, it would pull in an extra polyfill with all sorts of
// additional stuff (e.g. Array.from).
const EMPTY = {};
const CYCLE_DETECTED = {};
const { hasOwnProperty } = {};

if (__DEV__) {
  global.$RefreshReg$ = () => {};
  global.$RefreshSig$ = () => (type) => type;
}

function clear(): ModuleList {
  modules = new Map();

  // We return modules here so that we can assign an initial value to modules
  // when defining it. Otherwise, we would have to do "let modules = null",
  // which will force us to add "nullthrows" everywhere.
  return modules;
}

if (__DEV__) {
  // var verboseNamesToModuleIds: Map<string, number> = new Map();
  // var getModuleIdForVerboseName = (verboseName: string): number => {
  //   const moduleId = verboseNamesToModuleIds.get(verboseName);
  //   if (moduleId == null) {
  //     throw new Error(`Unknown named module: "${verboseName}"`);
  //   }
  //   return moduleId;
  // };
  var initializingModuleIds: ModuleID[] = [];
}

function define(factory: FactoryFn, moduleId: ModuleID, dependencyMap?: DependencyMap): void {
  if (modules.has(moduleId)) {
    if (__DEV__) {
      // (We take `inverseDependencies` from `arguments` to avoid an unused
      // named parameter in `define` in production.
      const inverseDependencies = arguments[4];

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

  const mod: ModuleDefinition = {
    dependencyMap,
    factory,
    hasError: false,
    importedAll: EMPTY,
    importedDefault: EMPTY,
    isInitialized: false,
    publicModule: { exports: {} },
  };

  modules.set(moduleId, mod);

  if (__DEV__) {
    // HMR
    mod.hot = createHotReloadingObject();

    // DEBUGGABLE MODULES NAMES
    // we take `verboseName` from `arguments` to avoid an unused named parameter
    // in `define` in production.
    const verboseName: string | void = arguments[3];
    if (verboseName) {
      mod.verboseName = verboseName;
      // verboseNamesToModuleIds.set(verboseName, moduleId);
    }
  }
}

function metroRequire(moduleId: ModuleID | VerboseModuleNameForDev): Exports {
  // if (__DEV__ && typeof moduleId === 'string') {
  //   const verboseName = moduleId;
  //   moduleId = getModuleIdForVerboseName(verboseName);
  //   console.warn(
  //     `Requiring module "${verboseName}" by name is only supported for ` +
  //       'debugging purposes and will BREAK IN PRODUCTION!'
  //   );
  // }

  if (__DEV__) {
    const initializingIndex = initializingModuleIds.indexOf(moduleId);
    if (initializingIndex !== -1) {
      const cycle = initializingModuleIds
        .slice(initializingIndex)
        .map((id) => modules.get(id)?.verboseName ?? '[unknown]');

      if (shouldPrintRequireCycle(cycle)) {
        cycle.push(cycle[0]); // We want to print A -> B -> A:

        console.warn(
          `Require cycle: ${cycle.join(' -> ')}\n\n` +
            'Require cycles are allowed, but can result in uninitialized values. ' +
            'Consider refactoring to remove the need for a cycle.'
        );
      }
    }
  }

  const module = modules.get(moduleId);

  return module && module.isInitialized
    ? module.publicModule.exports
    : guardedLoadModule(moduleId, module);
}

// We print require cycles unless they match a pattern in the
// `requireCycleIgnorePatterns` configuration.
function shouldPrintRequireCycle(modules: readonly (string | null | undefined)[]): boolean {
  // const regExps = eval(`${__METRO_GLOBAL_PREFIX__}__requireCycleIgnorePatterns`);
  const rcip = __METRO_GLOBAL_PREFIX__ + '__requireCycleIgnorePatterns';
  // Try using the globalThis version to reach outside the bundle in SSR bundles.
  const regExps = globalThis[rcip] ?? global[rcip] ?? [/(^|\/|\\)node_modules($|\/|\\)/];
  if (!Array.isArray(regExps)) {
    return true;
  }

  const isIgnored = (module: string | null | undefined): boolean =>
    module != null && regExps.some((regExp) => regExp.test(module));

  // Print the cycle unless any part of it is ignored
  return modules.every((module) => !isIgnored(module));
}

function metroImportDefault(moduleId: ModuleID | VerboseModuleNameForDev): any | Exports {
  if (modules.has(moduleId) && modules.get(moduleId)?.importedDefault !== EMPTY) {
    return modules.get(moduleId)!.importedDefault;
  }

  const exports: Exports = metroRequire(moduleId);
  const importedDefault: any | Exports = exports && exports.__esModule ? exports.default : exports;

  return (modules.get(moduleId)!.importedDefault = importedDefault);
}
metroRequire.importDefault = metroImportDefault;

function metroImportAll(
  moduleId: ModuleID | VerboseModuleNameForDev
): any | Exports | Record<string, any> {
  if (modules.has(moduleId) && modules.get(moduleId)?.importedAll !== EMPTY) {
    return modules.get(moduleId)!.importedAll;
  }

  const exports: Exports = metroRequire(moduleId);
  let importedAll: Exports | Record<string, any>;

  if (exports && exports.__esModule) {
    importedAll = exports;
  } else {
    importedAll = {};

    // Refrain from using Object.assign, it has to work in ES3 environments.
    if (exports) {
      for (const key in exports) {
        if (hasOwnProperty.call(exports, key)) {
          importedAll[key] = exports[key];
        }
      }
    }

    importedAll.default = exports;
  }

  return (modules.get(moduleId)!.importedAll = importedAll);
}

// NOTE(EvanBacon): Tag for e2e testing.
metroRequire[Symbol.for('expo.require')] = true;

metroRequire.importAll = metroImportAll;

// The `require.context()` syntax is never executed in the runtime because it is converted
// to `require()` in `metro/src/ModuleGraph/worker/collectDependencies.js` after collecting
// dependencies. If the feature flag is not enabled then the conversion never takes place and this error is thrown (development only).
metroRequire.context = function fallbackRequireContext() {
  if (__DEV__) {
    throw new Error(
      'The experimental Metro feature `require.context` is not enabled in your project.\nThis can be enabled by setting the `transformer.unstable_allowRequireContext` property to `true` in your Metro configuration.'
    );
  }
  throw new Error(
    'The experimental Metro feature `require.context` is not enabled in your project.'
  );
};

// `require.resolveWeak()` is a compile-time primitive (see collectDependencies.js)
metroRequire.resolveWeak = function fallbackRequireResolveWeak() {
  if (__DEV__) {
    throw new Error(
      'require.resolveWeak cannot be called dynamically. Ensure you are using the same version of `metro` and `metro-runtime`.'
    );
  }
  throw new Error('require.resolveWeak cannot be called dynamically.');
};

// Same as metroRequire but without the confusing error behavior. If the module import throws an error, it will be thrown normally.
metroRequire.unguarded = function requireUnguarded(
  moduleId: ModuleID | VerboseModuleNameForDev
): Exports {
  if (__DEV__) {
    const initializingIndex = initializingModuleIds.indexOf(moduleId);
    if (initializingIndex !== -1) {
      const cycle = initializingModuleIds
        .slice(initializingIndex)
        .map((id) => modules.get(id)?.verboseName ?? '[unknown]');

      if (shouldPrintRequireCycle(cycle)) {
        cycle.push(cycle[0]); // We want to print A -> B -> A:

        console.warn(
          `Require cycle: ${cycle.join(' -> ')}\n\n` +
            'Require cycles are allowed, but can result in uninitialized values. ' +
            'Consider refactoring to remove the need for a cycle.'
        );
      }
    }
  }

  const module = modules.get(moduleId);
  return module && module.isInitialized
    ? module.publicModule.exports
    : loadModuleImplementation(moduleId, module);
};

let inGuard = false;
function guardedLoadModule(
  moduleId: ModuleID,
  module: ModuleDefinition | undefined | null
): Exports {
  if (!inGuard && global.ErrorUtils) {
    inGuard = true;
    let returnValue;
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

const ID_MASK_SHIFT = 16;
const LOCAL_ID_MASK = ~0 >>> ID_MASK_SHIFT;

function unpackModuleId(moduleId: ModuleID): {
  localId: number;
  segmentId: number;
} {
  if (typeof moduleId !== 'number') {
    throw new Error('Module ID must be a number in unpackModuleId.');
  }
  const segmentId = moduleId >>> ID_MASK_SHIFT;
  const localId = moduleId & LOCAL_ID_MASK;
  return { segmentId, localId };
}
metroRequire.unpackModuleId = unpackModuleId;

function packModuleId(value: { localId: number; segmentId: number }): ModuleID {
  return (value.segmentId << ID_MASK_SHIFT) + value.localId;
}
metroRequire.packModuleId = packModuleId;

const moduleDefinersBySegmentID: (ModuleDefiner | undefined)[] = [];
const definingSegmentByModuleID: Map<ModuleID, number> = new Map();

function registerSegment(
  segmentId: number,
  moduleDefiner: ModuleDefiner,
  moduleIds?: readonly ModuleID[]
): void {
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
    moduleIds.forEach((moduleId) => {
      if (!modules.has(moduleId) && !definingSegmentByModuleID.has(moduleId)) {
        definingSegmentByModuleID.set(moduleId, segmentId);
      }
    });
  }
}

function loadModuleImplementation(
  moduleId: ModuleID,
  module: ModuleDefinition | undefined | null
): Exports {
  if (!module && moduleDefinersBySegmentID.length > 0) {
    const segmentId = definingSegmentByModuleID.get(moduleId) ?? 0;
    const definer = moduleDefinersBySegmentID[segmentId];
    if (definer != null) {
      definer(moduleId);
      module = modules.get(moduleId);
      definingSegmentByModuleID.delete(moduleId);
    }
  }

  // NOTE(EvanBacon): `nativeRequire` is used for legacy RAM bundles and the rest of the implementation doesn't appear to be public.
  // We use modern bundle splitting (with bytecode support) instead.
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

  const { factory, dependencyMap } = module;
  if (__DEV__) {
    initializingModuleIds.push(moduleId);
  }
  try {
    if (__DEV__) {
      Systrace.beginEvent('JS_require_' + (module.verboseName || moduleId));
    }

    const moduleObject: Module = module.publicModule;

    if (__DEV__) {
      moduleObject.hot = module.hot;

      var prevRefreshReg = global.$RefreshReg$;
      var prevRefreshSig = global.$RefreshSig$;
      if (Refresh != null) {
        const RefreshRuntime = Refresh;
        global.$RefreshReg$ = (type, id) => {
          RefreshRuntime.register(type, moduleId + ' ' + id);
        };
        global.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
      }
    }
    moduleObject.id = moduleId;

    // keep args in sync with with defineModuleCode in
    // metro/src/Resolver/index.js
    // and metro/src/ModuleGraph/worker.js
    factory?.(
      global,
      metroRequire,
      metroImportDefault,
      metroImportAll,
      moduleObject,
      moduleObject.exports,
      dependencyMap
    );

    // avoid removing factory in DEV mode as it breaks HMR
    if (!__DEV__) {
      module.factory = undefined;
      module.dependencyMap = undefined;
    }

    if (__DEV__) {
      // We know that __DEV__ is const and `Systrace` exists
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

function unknownModuleError(id: ModuleID): Error {
  let message = 'Requiring unknown module "' + id + '".';
  if (__DEV__) {
    message +=
      ' If you are sure the module exists, try restarting Metro. ' +
      'You may also want to run `yarn` or `npm install`.';
  }
  return Error(message);
}

if (__DEV__) {
  metroRequire.Systrace = {
    beginEvent: (): void => {},
    endEvent: (): void => {},
  };
  metroRequire.getModules = (): ModuleList => {
    return modules;
  };
  // HOT MODULE RELOADING
  var createHotReloadingObject = function () {
    const hot: HotModuleReloadingData = {
      _acceptCallback: null,
      _disposeCallback: null,
      _didAccept: false,
      accept: (callback?: HotModuleReloadingCallback): void => {
        hot._didAccept = true;
        hot._acceptCallback = callback;
      },
      dispose: (callback?: HotModuleReloadingCallback): void => {
        hot._disposeCallback = callback;
      },
    };
    return hot;
  };

  let reactRefreshTimeout: null | ReturnType<typeof setTimeout> = null;

  const metroHotUpdateModule = function (
    id: ModuleID,
    factory: FactoryFn | undefined,
    dependencyMap: DependencyMap,
    inverseDependencies: InverseDependencyMap
  ) {
    const mod = modules.get(id);
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

    const Refresh = requireRefresh();
    const refreshBoundaryIDs = new Set<ModuleID>();

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

    let didBailOut = false;
    let updatedModuleIDs;
    try {
      updatedModuleIDs = topologicalSort(
        [id], // Start with the changed module and go upwards
        (pendingID) => {
          const pendingModule = modules.get(pendingID);
          if (pendingModule == null) {
            // Nothing to do.
            return [];
          }
          const pendingHot = pendingModule.hot;
          if (pendingHot == null) {
            throw new Error('[Refresh] Expected module.hot to always exist in DEV.');
          }
          // A module can be accepted manually from within itself.
          let canAccept = pendingHot._didAccept;
          if (!canAccept && Refresh != null) {
            // Or React Refresh may mark it accepted based on exports.
            const isBoundary = isReactRefreshBoundary(Refresh, pendingModule.publicModule.exports);
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
          const parentIDs = inverseDependencies[pendingID];
          if (parentIDs.length === 0) {
            // Reload the app because the hot reload can't succeed.
            // This should work both on web and React Native.
            performFullRefresh('No root boundary', {
              source: mod,
              failed: pendingModule,
            });
            didBailOut = true;
            return [];
          }
          // This module can't handle the update but maybe all its parents can?
          // Put them all in the queue to run the same set of checks.
          return parentIDs;
        },
        () => didBailOut // Should we stop?
      ).reverse();
    } catch (e) {
      if (e === CYCLE_DETECTED) {
        performFullRefresh('Dependency cycle', {
          source: mod,
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
    const seenModuleIDs = new Set<ModuleID>();
    for (let i = 0; i < updatedModuleIDs.length; i++) {
      const updatedID = updatedModuleIDs[i];
      if (seenModuleIDs.has(updatedID)) {
        continue;
      }
      seenModuleIDs.add(updatedID);

      const updatedMod = modules.get(updatedID);
      if (updatedMod == null) {
        throw new Error('[Refresh] Expected to find the updated module.');
      }
      const prevExports = updatedMod.publicModule.exports;
      const didError = runUpdatedModule(
        updatedID,
        updatedID === id ? factory : undefined,
        updatedID === id ? dependencyMap : undefined
      );
      const nextExports = updatedMod.publicModule.exports;

      if (didError) {
        // The user was shown a redbox about module initialization.
        // There's nothing for us to do here until it's fixed.
        return;
      }

      if (refreshBoundaryIDs.has(updatedID)) {
        // Since we just executed the code for it, it's possible
        // that the new exports make it ineligible for being a boundary.
        const isNoLongerABoundary = !isReactRefreshBoundary(Refresh, nextExports);
        // It can also become ineligible if its exports are incompatible
        // with the previous exports.
        // For example, if you add/remove/change exports, we'll want
        // to re-execute the importing modules, and force those components
        // to re-render. Similarly, if you convert a class component
        // to a function, we want to invalidate the boundary.
        const didInvalidate = shouldInvalidateReactRefreshBoundary(
          Refresh,
          prevExports,
          nextExports
        );
        if (isNoLongerABoundary || didInvalidate) {
          // We'll be conservative. The only case in which we won't do a full
          // reload is if all parent modules are also refresh boundaries.
          // In that case we'll add them to the current queue.
          const parentIDs = inverseDependencies[updatedID];
          if (parentIDs.length === 0) {
            // Looks like we bubbled to the root. Can't recover from that.
            performFullRefresh(
              isNoLongerABoundary ? 'No longer a boundary' : 'Invalidated boundary',
              {
                source: mod,
                failed: updatedMod,
              }
            );
            return;
          }
          // Schedule all parent refresh boundaries to re-run in this loop.
          for (let j = 0; j < parentIDs.length; j++) {
            const parentID = parentIDs[j];
            const parentMod = modules.get(parentID);
            if (parentMod == null) {
              throw new Error('[Refresh] Expected to find parent module.');
            }
            const canAcceptParent = isReactRefreshBoundary(Refresh, parentMod.publicModule.exports);
            if (canAcceptParent) {
              // All parents will have to re-run too.
              refreshBoundaryIDs.add(parentID);
              updatedModuleIDs.push(parentID);
            } else {
              performFullRefresh('Invalidated boundary', {
                source: mod,
                failed: parentMod,
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
        reactRefreshTimeout = setTimeout(() => {
          reactRefreshTimeout = null;
          // Update React components.
          Refresh.performReactRefresh();
        }, 30);
      }
    }
  };

  const topologicalSort = function <T>(
    roots: T[],
    getEdges: (value: T) => T[],
    earlyStop: (value: T) => boolean
  ): T[] {
    const result: T[] = [];
    const visited = new Set<T>();
    const stack = new Set<T>();
    function traverseDependentNodes(node: T): void {
      if (stack.has(node)) {
        throw CYCLE_DETECTED;
      }
      if (visited.has(node)) {
        return;
      }
      visited.add(node);
      stack.add(node);
      const dependentNodes = getEdges(node);
      if (earlyStop(node)) {
        stack.delete(node);
        return;
      }
      dependentNodes.forEach((dependent) => {
        traverseDependentNodes(dependent);
      });
      stack.delete(node);
      result.push(node);
    }
    roots.forEach((root) => {
      traverseDependentNodes(root);
    });
    return result;
  };

  const runUpdatedModule = function (
    id: ModuleID,
    factory?: FactoryFn,
    dependencyMap?: DependencyMap
  ): boolean {
    const mod = modules.get(id);
    if (mod == null) {
      throw new Error('[Refresh] Expected to find the module.');
    }

    const { hot } = mod;
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
    const prevExports = mod.publicModule.exports;
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
        // @ts-expect-error
        hot._acceptCallback();
      } catch (error) {
        console.error(`Error while calling accept handler for module ${id}: `, error);
      }
    }
    // No error.
    return false;
  };

  const performFullRefresh = (
    reason: string,
    modules: {
      source?: ModuleDefinition;
      failed?: ModuleDefinition;
    }
  ) => {
    if (
      typeof window !== 'undefined' &&
      window.location != null &&
      typeof window.location.reload === 'function'
    ) {
      window.location.reload();
    } else {
      const Refresh = requireRefresh();
      if (Refresh != null) {
        const sourceName = modules.source?.verboseName ?? 'unknown';
        const failedName = modules.failed?.verboseName ?? 'unknown';
        Refresh.performFullRefresh(`Fast Refresh - ${reason} <${sourceName}> <${failedName}>`);
      } else {
        console.warn('Could not reload the application after an edit.');
      }
    }
  };

  // Modules that only export components become React Refresh boundaries.
  var isReactRefreshBoundary = function (Refresh: any, moduleExports: Exports): boolean {
    if (Refresh.isLikelyComponentType(moduleExports)) {
      return true;
    }
    if (moduleExports == null || typeof moduleExports !== 'object') {
      // Exit if we can't iterate over exports.
      return false;
    }
    let hasExports = false;
    let areAllExportsComponents = true;
    for (const key in moduleExports) {
      hasExports = true;
      if (key === '__esModule') {
        continue;
      }
      const desc = Object.getOwnPropertyDescriptor(moduleExports, key);
      if (desc && desc.get) {
        // Don't invoke getters as they may have side effects.
        return false;
      }
      const exportValue = moduleExports[key];
      if (!Refresh.isLikelyComponentType(exportValue)) {
        areAllExportsComponents = false;
      }
    }
    return hasExports && areAllExportsComponents;
  };

  var shouldInvalidateReactRefreshBoundary = (
    Refresh: any,
    prevExports: Exports,
    nextExports: Exports
  ) => {
    const prevSignature = getRefreshBoundarySignature(Refresh, prevExports);
    const nextSignature = getRefreshBoundarySignature(Refresh, nextExports);
    if (prevSignature.length !== nextSignature.length) {
      return true;
    }
    for (let i = 0; i < nextSignature.length; i++) {
      if (prevSignature[i] !== nextSignature[i]) {
        return true;
      }
    }
    return false;
  };

  // When this signature changes, it's unsafe to stop at this refresh boundary.
  var getRefreshBoundarySignature = (Refresh: any, moduleExports: Exports): any[] => {
    const signature: string[] = [];

    signature.push(Refresh.getFamilyByType(moduleExports));
    if (moduleExports == null || typeof moduleExports !== 'object') {
      // Exit if we can't iterate over exports.
      // (This is important for legacy environments.)
      return signature;
    }
    for (const key in moduleExports) {
      if (key === '__esModule') {
        continue;
      }
      const desc = Object.getOwnPropertyDescriptor(moduleExports, key);
      if (desc && desc.get) {
        continue;
      }
      const exportValue = moduleExports[key];
      signature.push(key);
      signature.push(Refresh.getFamilyByType(exportValue));
    }
    return signature;
  };

  var registerExportsForReactRefresh = (
    Refresh: any,
    moduleExports: Exports,
    moduleID: ModuleID
  ) => {
    Refresh.register(moduleExports, moduleID + ' %exports%');
    if (moduleExports == null || typeof moduleExports !== 'object') {
      // Exit if we can't iterate over exports.
      // (This is important for legacy environments.)
      return;
    }
    for (const key in moduleExports) {
      const desc = Object.getOwnPropertyDescriptor(moduleExports, key);
      if (desc && desc.get) {
        // Don't invoke getters as they may have side effects.
        continue;
      }
      const exportValue = moduleExports[key];
      const typeID = moduleID + ' %exports% ' + key;
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
