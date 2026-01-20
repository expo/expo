/**
 * Copyright © 2025 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This is added as `asyncRequireModulePath` in `@expo/metro-config`
 * Fork of https://github.com/facebook/metro/blob/b8e9e64f1de97a67234e223f5ee21524b160e8a5/packages/metro-runtime/src/modules/asyncRequire.js#L1
 * - Adds worker support.
 */

type MetroRequire = {
  (id: number): unknown;
  importAll: <T>(id: number) => T;
};

type DependencyMapPaths = { [moduleID: number | string]: unknown } | null;

declare const crossOriginIsolated: boolean | undefined;
declare let __METRO_GLOBAL_PREFIX__: string;

// Shim script that wraps around a given worker entrypoint and:
// - Remaps `fetch` to the base URL given
// - Remaps `importScripts` to the base URL given
// This doesn't cover all cases and won't fix that:
// - self.location will be set to a blob URL
// - new URL won't relatively resolve
// - XMLHttpRequest, WebSocket, etc won't relatively resolve
function makeWorkerContent(url: string): string {
  return `
    const ASYNC_WORKER_BASE = ${JSON.stringify(url)};
    const IMPORT_SCRIPTS = importScripts;
    const FETCH = fetch;
    const fromBaseURL = (input) => new URL(input, ASYNC_WORKER_BASE).href;
    self.fetch = function(input, init) {
      return FETCH(typeof input === 'string' ? fromBaseURL(input) : input, init);
    };
    self.importScripts = function(...urls) {
      return IMPORT_SCRIPTS.apply(self, urls.map(fromBaseURL));
    };
    importScripts(ASYNC_WORKER_BASE);
  `;
}

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
  const importAll = () => (require as unknown as MetroRequire).importAll<T>(moduleID);

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

asyncRequire.unstable_resolve = function unstable_resolve(
  moduleID: number,
  paths: DependencyMapPaths
) {
  if (!paths) {
    throw new Error('Bundle splitting is required for Web Worker imports');
  }
  const id = paths[moduleID];
  if (!id) {
    throw new Error('Worker import is missing from split bundle paths: ' + id);
  }
  return id;
};

// Wraps around `new Worker` and if `crossOriginIsolated` is truthy, indicating CORP/COEP is active,
// instantiates the worker with an inline script instead, which works around the CORS error. This is
// necessary if the worker script won't have the same CORP/COEP headers as the document
asyncRequire.unstable_createWorker = function unstable_createWorker(
  workerUrl: string,
  workerOpts?: WorkerOptions
) {
  if (typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated) {
    try {
      const content = makeWorkerContent(workerUrl);
      workerUrl = URL.createObjectURL(new Blob([content], { type: 'text/javascript' }));
      return new Worker(workerUrl, workerOpts);
    } finally {
      URL.revokeObjectURL(workerUrl);
    }
  } else {
    return new Worker(workerUrl, workerOpts);
  }
};

// TODO(@kitten): Missing metro type definitions
declare const module: any;

module.exports = asyncRequire;
