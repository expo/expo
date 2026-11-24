/**
 * Tests for asyncRequireModule.ts — verifies that the optional `moduleName`
 * parameter is forwarded through `asyncRequire` and `asyncRequireImpl` to
 * `require.importAll`.
 *
 * Since the module uses `(require as unknown as MetroRequire).importAll(...)`,
 * and jest provides each module its own `require`, we need to evaluate the
 * module source in a controlled environment similar to how Metro does.
 */

// The module references `__METRO_GLOBAL_PREFIX__` as a free variable
declare let __METRO_GLOBAL_PREFIX__: string;

describe('asyncRequireModule', () => {
  let mockImportAll: jest.Mock;
  let mockRequire: any;
  let asyncRequire: any;
  let nativeImport: jest.Mock;
  const originalExpoOs = process.env.EXPO_OS;

  beforeEach(() => {
    mockImportAll = jest.fn((id: number, _moduleName?: string) => ({
      default: `module-${id}`,
    }));

    // Build a fake require that has importAll attached
    mockRequire = Object.assign(jest.fn(), {
      importAll: mockImportAll,
    });

    // Set up the Metro global prefix
    (globalThis as any).__METRO_GLOBAL_PREFIX__ = '';

    // Clear any previous __loadBundleAsync
    delete (globalThis as any).__loadBundleAsync;

    // This is a handwritten copy. Keep it in sync with asyncRequireModule.ts.
    const moduleObj = { exports: {} as any };
    // eslint-disable-next-line no-new-func
    const moduleFn = new Function(
      'require',
      'module',
      'exports',
      '__METRO_GLOBAL_PREFIX__',
      'nativeImport',
      `
      "use strict";

      function makeWorkerContent(url) {
        return '';
      }

      var loadedWorkerChunks = new Set();

      function loadWorkerChunks(urls) {
        var pendingUrls = urls.filter(function(url) { return !loadedWorkerChunks.has(url); });
        try {
          pendingUrls.forEach(function(url) {
            importScripts(url);
            loadedWorkerChunks.add(url);
          });
        } catch (error) {
          if (!(error instanceof TypeError)) throw error;
          // The module uses a native import() here, which this evaluated copy cannot run.
          return Promise.all(pendingUrls.map(function(url) {
            return nativeImport(url).then(function() { loadedWorkerChunks.add(url); });
          })).then(function() {});
        }
      }

      function maybeLoadBundle(moduleID, paths) {
        var loadBundle = globalThis[(__METRO_GLOBAL_PREFIX__ || '') + '__loadBundleAsync'];
        if (loadBundle != null) {
          var stringModuleID = String(moduleID);
          if (paths != null) {
            var bundlePath = paths[stringModuleID];
            if (bundlePath != null) {
              return loadBundle(bundlePath);
            }
          }
        }
        return undefined;
      }

      function asyncRequireImpl(moduleID, paths, moduleName) {
        var importAll = function() { return require.importAll(moduleID, moduleName); };

        // On web, importing synchronously first prevents double-loading preloaded scripts
        if (process.env.EXPO_OS === 'web') {
          var bundlePath = paths && paths[String(moduleID)];
          if (Array.isArray(bundlePath)) {
            if (typeof importScripts === 'function') {
              try {
                var loading = loadWorkerChunks(bundlePath);
                return loading ? loading.then(importAll) : importAll();
              } catch (error) {
                return Promise.reject(error);
              }
            }
            var loadBundle = globalThis[(__METRO_GLOBAL_PREFIX__ || '') + '__loadBundleAsync'];
            if (loadBundle && loadBundle.isReady && loadBundle.isReady(bundlePath)) return importAll();
            var maybeLoadBundlePromise = maybeLoadBundle(moduleID, paths);
            if (maybeLoadBundlePromise != null) return maybeLoadBundlePromise.then(importAll);
            throw new Error(
              'Cannot import module ' + (moduleName == null ? moduleID : moduleName) + ': the async bundle loader is unavailable. ' +
              'Load the initial Expo bundle before importing these chunks: ' + bundlePath.join(', ')
            );
          }
          try {
            return importAll();
          } catch (error) {
            var maybeLoadBundlePromise = maybeLoadBundle(moduleID, paths);
            if (maybeLoadBundlePromise != null) {
              return maybeLoadBundlePromise.then(importAll);
            }
            throw error;
          }
        }

        // On native, requiring a missing module reports a fatal error instead of
        // throwing, so the split bundle must be loaded before importing
        var maybeLoadBundlePromise = maybeLoadBundle(moduleID, paths);
        if (maybeLoadBundlePromise != null) {
          return maybeLoadBundlePromise.then(importAll);
        }
        return importAll();
      }

      function asyncRequire(moduleID, paths, moduleName) {
        var ret = asyncRequireImpl(moduleID, paths, moduleName);
        var promise = Promise.resolve(ret);
        promise._result = ret;
        return promise;
      }

      asyncRequire.unstable_importMaybeSync = function(moduleID, paths) {
        return asyncRequireImpl(moduleID, paths);
      };

      asyncRequire.prefetch = function(moduleID, paths, moduleName) {
        if (typeof importScripts === 'function' && Array.isArray(paths && paths[String(moduleID)])) return;
        var p = maybeLoadBundle(moduleID, paths);
        if (p) p.then(function(){}, function(){});
      };

      module.exports = asyncRequire;
      `
    );
    nativeImport = jest.fn(async () => {});
    moduleFn(mockRequire, moduleObj, moduleObj.exports, '', nativeImport);
    asyncRequire = moduleObj.exports;
  });

  afterEach(() => {
    delete (globalThis as any).importScripts;
    delete (globalThis as any).__loadBundleAsync;
    delete (globalThis as any).__METRO_GLOBAL_PREFIX__;
    process.env.EXPO_OS = originalExpoOs;
  });

  it('calls importAll with moduleID and moduleName when no bundle loading needed', async () => {
    const result = await asyncRequire(42, null, 'my-module');

    expect(mockImportAll).toHaveBeenCalledWith(42, 'my-module');
    expect(result).toEqual({ default: 'module-42' });
  });

  it.each([false, true])(
    'waits before running a partially registered array (maybeSync: %s)',
    async (maybeSync) => {
      process.env.EXPO_OS = 'web';
      let finish!: () => void;
      const loader = Object.assign(
        jest.fn(
          () =>
            new Promise<void>((resolve) => {
              finish = resolve;
            })
        ),
        { isReady: () => false }
      );
      (globalThis as any).__loadBundleAsync = loader;
      const result = maybeSync
        ? asyncRequire.unstable_importMaybeSync(42, { 42: ['/shared.js'] })
        : asyncRequire(42, { 42: ['/shared.js'] });
      expect(mockImportAll).not.toHaveBeenCalled();
      finish();
      await expect(result).resolves.toEqual({ default: 'module-42' });
      expect(mockImportAll).toHaveBeenCalledTimes(1);
    }
  );

  it('preserves synchronous hydration for confirmed-ready arrays', () => {
    process.env.EXPO_OS = 'web';
    const loader = Object.assign(jest.fn(), { isReady: () => true });
    (globalThis as any).__loadBundleAsync = loader;
    const result = asyncRequire(42, { 42: ['/shared.js', '/route.js'] });
    expect(result._result).toEqual({ default: 'module-42' });
    expect(asyncRequire.unstable_importMaybeSync(42, { 42: ['/route.js'] })).toEqual({
      default: 'module-42',
    });
    expect(loader).not.toHaveBeenCalled();
  });

  it('does not attempt factory execution for an array without a loader', () => {
    process.env.EXPO_OS = 'web';
    expect(() => asyncRequire(42, { 42: ['/shared.js'] })).toThrow('loader');
    expect(mockImportAll).not.toHaveBeenCalled();
  });

  describe('in a worker', () => {
    let importScripts: jest.Mock;

    beforeEach(() => {
      process.env.EXPO_OS = 'web';
      importScripts = jest.fn();
      (globalThis as any).importScripts = importScripts;
    });

    it('loads each chunk of an array one time with importScripts, then imports synchronously', () => {
      const loader = Object.assign(jest.fn(), { isReady: () => false });
      (globalThis as any).__loadBundleAsync = loader;

      expect(asyncRequire(42, { 42: ['/shared.js', '/route.js'] })._result).toEqual({
        default: 'module-42',
      });
      expect(
        asyncRequire.unstable_importMaybeSync(43, { 43: ['/shared.js', '/other.js'] })
      ).toEqual({ default: 'module-43' });
      expect(importScripts.mock.calls).toEqual([['/shared.js'], ['/route.js'], ['/other.js']]);
      expect(loader).not.toHaveBeenCalled();
    });

    it('rejects when importScripts throws, and loads the chunk again on the next import', async () => {
      importScripts.mockImplementationOnce(() => {
        throw new Error('NetworkError');
      });

      await expect(asyncRequire(42, { 42: ['/route.js'] })).rejects.toThrow('NetworkError');
      expect(mockImportAll).not.toHaveBeenCalled();
      await expect(asyncRequire(42, { 42: ['/route.js'] })).resolves.toEqual({
        default: 'module-42',
      });
      expect(importScripts).toHaveBeenCalledTimes(2);
    });

    it('loads chunks with import() in a module worker, then imports', async () => {
      importScripts.mockImplementation(() => {
        throw new TypeError("Module scripts don't support importScripts().");
      });

      const result = asyncRequire(42, { 42: ['/shared.js', '/route.js'] });
      expect(mockImportAll).not.toHaveBeenCalled();
      await expect(result).resolves.toEqual({ default: 'module-42' });
      expect(nativeImport.mock.calls).toEqual([['/shared.js'], ['/route.js']]);
      await asyncRequire(43, { 43: ['/shared.js'] });
      expect(nativeImport).toHaveBeenCalledTimes(2);
    });

    it('does not load chunks for prefetch', () => {
      const loader = jest.fn(async () => {});
      (globalThis as any).__loadBundleAsync = loader;

      asyncRequire.prefetch(42, { 42: ['/route.js'] });
      expect(importScripts).not.toHaveBeenCalled();
      expect(loader).not.toHaveBeenCalled();
    });
  });

  it('calls importAll without moduleName when not provided', async () => {
    const result = await asyncRequire(42, null);

    expect(mockImportAll).toHaveBeenCalledWith(42, undefined);
    expect(result).toEqual({ default: 'module-42' });
  });

  it('falls back to bundle load on web when importAll throws, then retries with moduleName', async () => {
    process.env.EXPO_OS = 'web';
    mockImportAll
      .mockImplementationOnce(() => {
        throw new Error('Module not loaded');
      })
      .mockImplementationOnce(() => ({ default: 'module-42' }));

    let resolveBundle!: () => void;
    const bundlePromise = new Promise<void>((resolve) => {
      resolveBundle = resolve;
    });

    (globalThis as any).__loadBundleAsync = jest.fn(() => bundlePromise);

    const paths = { '42': '/bundles/my-module.bundle' };
    const resultPromise = asyncRequire(42, paths, 'my-module');

    // Initial importAll attempt happened; second is gated on the bundle promise.
    expect(mockImportAll).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__loadBundleAsync).toHaveBeenCalledWith('/bundles/my-module.bundle');

    resolveBundle();
    const result = await resultPromise;

    expect(mockImportAll).toHaveBeenCalledTimes(2);
    expect(mockImportAll).toHaveBeenLastCalledWith(42, 'my-module');
    expect(result).toEqual({ default: 'module-42' });
  });

  it('does not load the bundle on web when importAll succeeds (preloaded bundle case)', async () => {
    process.env.EXPO_OS = 'web';
    (globalThis as any).__loadBundleAsync = jest.fn(() => Promise.resolve());

    const paths = { '42': '/bundles/my-module.bundle' };
    const result = await asyncRequire(42, paths, 'my-module');

    expect(mockImportAll).toHaveBeenCalledWith(42, 'my-module');
    expect((globalThis as any).__loadBundleAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ default: 'module-42' });
  });

  it('re-throws the import error on web when no bundle path is configured', () => {
    process.env.EXPO_OS = 'web';
    mockImportAll.mockImplementationOnce(() => {
      throw new Error('Module not loaded');
    });

    expect(() => asyncRequire(42, null, 'my-module')).toThrow('Module not loaded');
  });

  it('loads the bundle on native before requiring split modules', async () => {
    process.env.EXPO_OS = 'ios';
    let bundleLoaded = false;
    mockImportAll.mockImplementation((id: number) =>
      bundleLoaded ? { default: `module-${id}` } : undefined
    );
    (globalThis as any).__loadBundleAsync = jest.fn(() => {
      bundleLoaded = true;
      return Promise.resolve();
    });

    const paths = { '42': '/bundles/my-module.bundle' };
    const result = await asyncRequire(42, paths, 'my-module');

    expect((globalThis as any).__loadBundleAsync).toHaveBeenCalledWith('/bundles/my-module.bundle');
    expect(mockImportAll).toHaveBeenCalledTimes(1);
    expect(mockImportAll).toHaveBeenCalledWith(42, 'my-module');
    expect(result).toEqual({ default: 'module-42' });
  });

  it('forwards array payloads opaquely and waits before importing on native', async () => {
    process.env.EXPO_OS = 'ios';
    let finish!: () => void;
    (globalThis as any).__loadBundleAsync = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const payload = ['/shared.js', '/route.js'];
    const result = asyncRequire(42, { '42': payload }, 'route');
    expect((globalThis as any).__loadBundleAsync).toHaveBeenCalledWith(payload);
    expect(mockImportAll).not.toHaveBeenCalled();
    finish();
    await expect(result).resolves.toEqual({ default: 'module-42' });
    expect(mockImportAll).toHaveBeenCalledTimes(1);
  });

  it('imports synchronously on native when the module is inlined (no split bundle path)', () => {
    process.env.EXPO_OS = 'ios';
    (globalThis as any).__loadBundleAsync = jest.fn(() => Promise.resolve());

    const ret = asyncRequire(42, null, 'my-module');

    expect((globalThis as any).__loadBundleAsync).not.toHaveBeenCalled();
    expect(mockImportAll).toHaveBeenCalledWith(42, 'my-module');
    expect(ret._result).toEqual({ default: 'module-42' });
  });

  describe('thenable return value', () => {
    it('returns a Promise with a synchronous _result when no bundle load was needed', async () => {
      const ret = asyncRequire(42, null, 'my-module');

      const onFinally = jest.fn();

      expect(ret).toBeInstanceOf(Promise);
      expect(typeof ret.catch).toBe('function');
      expect(typeof ret.finally).toBe('function');
      expect(ret._result).toEqual({ default: 'module-42' });
      await expect(ret.finally(onFinally)).resolves.toEqual({ default: 'module-42' });
      expect(onFinally).toHaveBeenCalledTimes(1);
    });

    it('returns a Promise with a Promise _result when a bundle load was needed', async () => {
      process.env.EXPO_OS = 'web';
      mockImportAll
        .mockImplementationOnce(() => {
          throw new Error('Module not loaded');
        })
        .mockImplementationOnce(() => ({ default: 'module-42' }));

      (globalThis as any).__loadBundleAsync = jest.fn(() => Promise.resolve());

      const ret = asyncRequire(42, { '42': '/bundles/my-module.bundle' }, 'my-module');

      expect(ret).toBeInstanceOf(Promise);
      expect(typeof ret.catch).toBe('function');
      expect(typeof ret.finally).toBe('function');
      expect(ret._result).toBeInstanceOf(Promise);
      await expect(ret._result).resolves.toEqual({ default: 'module-42' });
    });

    it('supports catching a rejected bundle load', async () => {
      process.env.EXPO_OS = 'ios';
      const error = new Error('Bundle load failed');
      (globalThis as any).__loadBundleAsync = jest.fn(() => Promise.reject(error));

      const ret = asyncRequire(42, { '42': '/bundles/my-module.bundle' }, 'my-module');

      await expect(ret.catch((caughtError: Error) => caughtError)).resolves.toBe(error);
    });
  });

  describe('unstable_importMaybeSync', () => {
    it('returns synchronously when no bundle loading needed', () => {
      const result = asyncRequire.unstable_importMaybeSync(42, null);

      expect(mockImportAll).toHaveBeenCalledWith(42, undefined);
      expect(result).toEqual({ default: 'module-42' });
    });
  });

  describe('prefetch', () => {
    it('forwards arrays without executing a factory', async () => {
      (globalThis as any).__loadBundleAsync = jest.fn(async () => {});
      const payload = ['/shared.js', '/route.js'];
      asyncRequire.prefetch(42, { '42': payload }, 'route');
      expect((globalThis as any).__loadBundleAsync).toHaveBeenCalledWith(payload);
      expect(mockImportAll).not.toHaveBeenCalled();
    });
    it('does not call importAll (only triggers bundle loading)', () => {
      (globalThis as any).__loadBundleAsync = jest.fn(() => Promise.resolve());

      const paths = { '42': '/bundles/my-module.bundle' };
      asyncRequire.prefetch(42, paths, 'my-module');

      expect(mockImportAll).not.toHaveBeenCalled();
      expect((globalThis as any).__loadBundleAsync).toHaveBeenCalledWith(
        '/bundles/my-module.bundle'
      );
    });
  });
});
