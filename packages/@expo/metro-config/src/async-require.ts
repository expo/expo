/**
 * Copyright © 2025 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of https://github.com/facebook/metro/blob/b8e9e64f1de97a67234e223f5ee21524b160e8a5/packages/metro-runtime/src/modules/asyncRequire.js#L1
 */

type MetroRequire = {
  (id: number): unknown;
  importAll: <T>(id: number) => T;
};

declare const require: MetroRequire;

type DependencyMapPaths = { [moduleID: number | string]: unknown } | null;

declare let __METRO_GLOBAL_PREFIX__: string;

function maybeLoadBundle(moduleID: number, paths: DependencyMapPaths): void | Promise<void> {
  const loadBundle: (bundlePath: unknown) => Promise<void> = (global as any)[
    `${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`
  ];

  if (loadBundle != null) {
    const stringModuleID = String(moduleID);
    if (paths != null) {
      const bundlePath = paths[stringModuleID];
      if (bundlePath != null) {
        // NOTE: Errors will be swallowed by asyncRequire.prefetch
        return loadBundle(bundlePath);
      }
    }
  }

  return undefined;
}

function asyncRequireImpl<T>(moduleID: number, paths: DependencyMapPaths): Promise<T> | T {
  const maybeLoadBundlePromise = maybeLoadBundle(moduleID, paths);
  const importAll = () => require.importAll<T>(moduleID);

  if (maybeLoadBundlePromise != null) {
    return maybeLoadBundlePromise.then(importAll);
  }

  return importAll();
}

async function asyncRequire<T>(
  moduleID: number,
  paths: DependencyMapPaths,
  moduleName?: string // unused
): Promise<T> {
  return asyncRequireImpl<T>(moduleID, paths);
}

// Synchronous version of asyncRequire, which can still return a promise
// if the module is split.
asyncRequire.unstable_importMaybeSync = function unstable_importMaybeSync<T>(
  moduleID: number,
  paths: DependencyMapPaths
): Promise<T> | T {
  return asyncRequireImpl(moduleID, paths);
};

asyncRequire.prefetch = function (
  moduleID: number,
  paths: DependencyMapPaths,
  moduleName?: string // unused
): void {
  maybeLoadBundle(moduleID, paths)?.then(
    () => {},
    () => {}
  );
};

module.exports = asyncRequire;
