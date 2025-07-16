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
  __r: RequireFn;
  [key: string]: any;
};
declare let __DEV__: boolean;
// declare let __METRO_GLOBAL_PREFIX__: string;

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
    importDefault: RequireFn,
    importAll: RequireFn,
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

if (__DEV__ || !global.__expo__d) {
  global.__expo__r = expo_require as RequireFn;
  global.__expo__d = define as DefineFn;
  //   global.__c = clear;
  //   global.__registerSegment = registerSegment;
}

var modules = new Map();

// Don't use a Symbol here, it would pull in an extra polyfill with all sorts of
// additional stuff (e.g. Array.from).
const EMPTY = {};
const { hasOwnProperty } = {};

if (__DEV__) {
  var initializingModuleIds: ModuleID[] = [];
}

function define(factory: FactoryFn, moduleId: ModuleID, dependencyMap?: DependencyMap): void {
  if (modules.has(moduleId)) {
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

function expo_require(
  moduleId: ModuleID | VerboseModuleNameForDev,
  moduleIdHint?: string
): Exports {
  //   if (__DEV__) {
  //     const initializingIndex = initializingModuleIds.indexOf(moduleId);
  //     if (initializingIndex !== -1) {
  //       const cycle = initializingModuleIds
  //         .slice(initializingIndex)
  //         .map((id) => modules.get(id)?.verboseName ?? '[unknown]');

  //     //   if (shouldPrintRequireCycle(cycle)) {
  //     //     cycle.push(cycle[0]); // We want to print A -> B -> A:

  //     //     console.warn(
  //     //       `Require cycle: ${cycle.join(' -> ')}\n\n` +
  //     //         'Require cycles are allowed, but can result in uninitialized values. ' +
  //     //         'Consider refactoring to remove the need for a cycle.'
  //     //     );
  //     //   }
  //     }
  //   }

  const module = modules.get(moduleId);
  return module && module.isInitialized
    ? module.publicModule.exports
    : loadModuleImplementation(moduleId, module, moduleIdHint);
  //   const module = modules.get(moduleId);

  //   return module && module.isInitialized
  //     ? module.publicModule.exports
  //     : guardedLoadModule(moduleId, module, moduleIdHint);
}

// We print require cycles unless they match a pattern in the
// `requireCycleIgnorePatterns` configuration.
// function shouldPrintRequireCycle(modules: readonly (string | null | undefined)[]): boolean {
//   // const regExps = eval(`${__METRO_GLOBAL_PREFIX__}__requireCycleIgnorePatterns`);
//   const rcip = __METRO_GLOBAL_PREFIX__ + '__requireCycleIgnorePatterns';
//   // Try using the globalThis version to reach outside the bundle in SSR bundles.
//   const regExps = globalThis[rcip] ?? global[rcip] ?? [/(^|\/|\\)node_modules($|\/|\\)/];
//   if (!Array.isArray(regExps)) {
//     return true;
//   }

//   const isIgnored = (module: string | null | undefined): boolean =>
//     module != null && regExps.some((regExp) => regExp.test(module));

//   // Print the cycle unless any part of it is ignored
//   return modules.every((module) => !isIgnored(module));
// }

function expo_import_default(moduleId: ModuleID | VerboseModuleNameForDev): any | Exports {
  if (modules.has(moduleId) && modules.get(moduleId)?.importedDefault !== EMPTY) {
    return modules.get(moduleId)!.importedDefault;
  }

  const exports: Exports = expo_require(moduleId);
  const importedDefault: any | Exports = exports && exports.__esModule ? exports.default : exports;

  return (modules.get(moduleId)!.importedDefault = importedDefault);
}
expo_require.importDefault = expo_import_default;

function expo_import_all(
  moduleId: ModuleID | VerboseModuleNameForDev
): any | Exports | Record<string, any> {
  if (modules.has(moduleId) && modules.get(moduleId)?.importedAll !== EMPTY) {
    return modules.get(moduleId)!.importedAll;
  }

  const exports: Exports = expo_require(moduleId);
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
expo_require[Symbol.for('expo.require')] = true;

expo_require.importAll = expo_import_all;

// let inGuard = false;
// function guardedLoadModule(
//   moduleId: ModuleID,
//   module: ModuleDefinition | undefined | null,
//   moduleIdHint?: string
// ): Exports {
//   if (!inGuard && global.ErrorUtils) {
//     inGuard = true;
//     let returnValue;
//     try {
//       returnValue = loadModuleImplementation(moduleId, module, moduleIdHint);
//     } catch (e) {
//       // TODO: (moti) T48204692 Type this use of ErrorUtils.
//       global.ErrorUtils.reportFatalError(e);
//     }
//     inGuard = false;
//     return returnValue;
//   } else {
//     return loadModuleImplementation(moduleId, module, moduleIdHint);
//   }
// }

// const ID_MASK_SHIFT = 16;
// const LOCAL_ID_MASK = ~0 >>> ID_MASK_SHIFT;

// function unpackModuleId(moduleId: ModuleID): {
//   localId: number;
//   segmentId: number;
// } {
//   if (typeof moduleId !== 'number') {
//     throw new Error('Module ID must be a number in unpackModuleId.');
//   }
//   const segmentId = moduleId >>> ID_MASK_SHIFT;
//   const localId = moduleId & LOCAL_ID_MASK;
//   return { segmentId, localId };
// }
// expo_require.unpackModuleId = unpackModuleId;

// function packModuleId(value: { localId: number; segmentId: number }): ModuleID {
//   return (value.segmentId << ID_MASK_SHIFT) + value.localId;
// }
// expo_require.packModuleId = packModuleId;

const moduleDefinersBySegmentID: (ModuleDefiner | undefined)[] = [];
const definingSegmentByModuleID: Map<ModuleID, number> = new Map();

// function registerSegment(
//   segmentId: number,
//   moduleDefiner: ModuleDefiner,
//   moduleIds?: readonly ModuleID[]
// ): void {
//   moduleDefinersBySegmentID[segmentId] = moduleDefiner;
//   if (__DEV__) {
//     if (segmentId === 0 && moduleIds) {
//       throw new Error('registerSegment: Expected moduleIds to be null for main segment');
//     }
//     if (segmentId !== 0 && !moduleIds) {
//       throw new Error('registerSegment: Expected moduleIds to be passed for segment #' + segmentId);
//     }
//   }
//   if (moduleIds) {
//     moduleIds.forEach((moduleId) => {
//       if (!modules.has(moduleId) && !definingSegmentByModuleID.has(moduleId)) {
//         definingSegmentByModuleID.set(moduleId, segmentId);
//       }
//     });
//   }
// }

function loadModuleImplementation(
  moduleId: ModuleID,
  module: ModuleDefinition | undefined | null,
  moduleIdHint?: string
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
    throw unknownModuleError(moduleId, moduleIdHint);
  }

  if (module.hasError) {
    throw module.error;
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
    const moduleObject: Module = module.publicModule;
    moduleObject.id = moduleId;

    // keep args in sync with with defineModuleCode in
    // metro/src/Resolver/index.js
    // and metro/src/ModuleGraph/worker.js
    factory?.(
      global,
      expo_require,
      expo_import_default,
      expo_import_all,
      moduleObject,
      moduleObject.exports,
      dependencyMap
    );

    // avoid removing factory in DEV mode as it breaks HMR
    if (!__DEV__) {
      module.factory = undefined;
      module.dependencyMap = undefined;
    }

    return moduleObject.exports;
  } catch (e) {
    module.hasError = true;
    module.error = e;
    module.isInitialized = false;
    module.publicModule.exports = undefined;
    throw e;
  }
}

function unknownModuleError(id: ModuleID, moduleIdHint?: string): Error {
  let message =
    'Requiring unknown module "' + (id ?? moduleIdHint ?? `[unknown optional import]`) + '".';
  if (__DEV__) {
    message +=
      ' If you are sure the module exists, try restarting Metro. ' +
      'You may also want to run `yarn` or `npm install`.';
  }
  return Error(message);
}

// Emulate the Node.js `import { builtinModules } from 'module'` API.
// Use `__expo__r.builtinModules`
Object.defineProperty(expo_require, 'builtinModules', {
  get() {
    return Array.from(modules.keys());
  },
});

if (__DEV__) {
  expo_require.getModules = (): ModuleList => {
    return modules;
  };
}
