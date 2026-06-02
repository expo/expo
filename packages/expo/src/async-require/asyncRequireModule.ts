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
  importAll: <T>(id: number, moduleName?: string) => T;
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
  const loadBundle: (bundlePath: unknown) => Promise<void> = (globalThis as any)[
    `${__METRO_GLOBAL_PREFIX__ ?? ''}__loadBundleAsync`
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

function asyncRequireImpl<T>(
  moduleID: number,
  paths: DependencyMapPaths,
  moduleName?: string
): Promise<T> | T {
  const importAll = () => (require as unknown as MetroRequire).importAll<T>(moduleID, moduleName);

  // Fast path: if the chunk containing this module has already been delivered
  // (e.g. via a `<script defer>` injected into the SSR document) the module is
  // already in Metro's registry, and `importAll` returns synchronously. Skipping
  // `__loadBundleAsync` here prevents a redundant network round-trip and — more
  // importantly — lets the caller bypass the `Promise` wrapping that forces
  // React.lazy / Suspense to fall back during hydration.
  try {
    return importAll();
  } catch (e: unknown) {
    if (!(e instanceof Error) || !e.message.includes('Requiring unknown module')) {
      throw e;
    }
    // Fall through — the module isn't registered yet, fetch the chunk.
  }

  const maybeLoadBundlePromise = maybeLoadBundle(moduleID, paths);
  if (maybeLoadBundlePromise != null) {
    return maybeLoadBundlePromise.then(importAll);
  }

  return importAll();
}

// NOTE: This used to be `async`, which forced every resolved import to round-trip
// through a microtask. Returning `asyncRequireImpl`'s result directly lets the
// sync fast path above stay synchronous through to the caller — required to
// avoid a Suspense fallback flicker during SSR hydration. Callers that previously
// chained `.then()` on `import()` should switch to `await` if they need to be
// agnostic to whether the chunk happens to be preloaded.
function asyncRequire<T>(
  moduleID: number,
  paths: DependencyMapPaths,
  moduleName?: string
): Promise<T> | T {
  return asyncRequireImpl<T>(moduleID, paths, moduleName);
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
