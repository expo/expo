/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Platform } from 'react-native';

import { loadBundleAsync } from './loadBundle';

type ImportBundleNames = Record<string, string>;

type MetroRequire = {
  (id: number): any;
  importAll: (id: number) => any;
};

type ImportBundlePromises = Record<string, Promise<any>> & {
  __proto__?: null;
};

/**
 * Must satisfy the requirements of the Metro bundler.
 * https://github.com/facebook/metro/blob/f9fe277986ff7e7e53ae0418040f3aa1eb1c7056/packages/metro/src/ModuleGraph/worker/collectDependencies.js#L629-L639
 *
 * And https://github.com/facebook/metro/blob/fc29a1177f883144674cf85a813b58567f69d545/packages/metro/src/lib/getAppendScripts.js#L54-L56
 */
type AsyncRequire = {
  <TModule>(
    moduleID: number,
    moduleName: string,
    paths: ImportBundleNames,
    options?: { isPrefetchOnly: boolean }
  ): Promise<TModule | void> | TModule;
  prefetch(moduleID: number, moduleName: string, paths: ImportBundleNames): void;
  /** NOTE(EvanBacon): Unclear what this should return `__jsResource` ?? */
  resource(moduleID: number, moduleName: string, paths: ImportBundleNames): never;
};

/** Create an `asyncRequire` function in the expected shape for Metro bundler. */
export function buildAsyncRequire(metroRequire: MetroRequire): AsyncRequire {
  const importBundlePromises: ImportBundlePromises = Object.create(null);

  function asyncRequire<TModule>(
    moduleID: number,
    moduleName: string,
    paths: ImportBundleNames,
    options: { isPrefetchOnly: boolean } = { isPrefetchOnly: false }
  ): Promise<TModule | void> | TModule {
    if (
      process.env.NODE_ENV === 'production' ||
      // Disable in static rendering environments.
      (Platform.OS === 'web' && typeof window === 'undefined')
    ) {
      // TODO: Don't disable in production

      return Promise.resolve().then(() => metroRequire.importAll(moduleID));
    }

    if (options.isPrefetchOnly) {
      return Promise.resolve();
    }

    const stringModuleID = String(moduleID);
    // This is basically `__webpack_require__.u` -> returns the bundle path for a numeric moduleID
    const bundlePath = paths[stringModuleID];
    if (bundlePath) {
      // Prevent loading the same module more than once.
      if (!importBundlePromises[stringModuleID]) {
        importBundlePromises[stringModuleID] = loadBundleAsync(bundlePath).then(() =>
          metroRequire(moduleID)
        );
      }
      // Return for the user to resolve.
      return importBundlePromises[stringModuleID];
    }

    return metroRequire.importAll(moduleID);
  }

  asyncRequire.prefetch = function (
    moduleID: number,
    moduleName: string,
    paths: ImportBundleNames
  ): void {
    // TODO: Don't disable in production
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const result = asyncRequire(moduleID, moduleName, paths, {
      isPrefetchOnly: true,
    });
    if (result instanceof Promise) {
      result.then(
        () => {},
        () => {}
      );
    }
  };

  asyncRequire.resource = function (
    moduleID: number,
    moduleName: string,
    paths: ImportBundleNames
  ): never {
    throw new Error('Unimplemented Metro runtime feature');
  };

  return asyncRequire;
}
