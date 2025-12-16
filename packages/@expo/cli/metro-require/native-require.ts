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

// NOTE(EvanBacon): Should be `__expo__d`
if (__DEV__ || !global[`${__METRO_GLOBAL_PREFIX__}__d`]) {
  global[`${__METRO_GLOBAL_PREFIX__}__r`] = metroRequire as RequireFn;
  global[`${__METRO_GLOBAL_PREFIX__}__d`] = define as DefineFn;
  //   global.__c = clear;
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

function metroRequire(
  moduleId: ModuleID | VerboseModuleNameForDev,
  moduleIdHint?: string
): Exports {
  const module = modules.get(moduleId);
  return module && module.isInitialized
    ? module.publicModule.exports
    : loadModuleImplementation(moduleId, module, moduleIdHint);
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
metroRequire[Symbol.for('expo.embeddedRequire')] = true;

metroRequire.importAll = metroImportAll;

const moduleDefinersBySegmentID: (ModuleDefiner | undefined)[] = [];
const definingSegmentByModuleID: Map<ModuleID, number> = new Map();

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

if (__DEV__) {
  metroRequire.getModules = (): ModuleList => {
    return modules;
  };
}
