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

    // Evaluate the compiled module in a scope where `require` is our mock.
    // We use Function constructor to create a scope with our own `require`.
    const moduleObj = { exports: {} as any };
    // eslint-disable-next-line no-new-func
    const moduleFn = new Function(
      'require',
      'module',
      'exports',
      '__METRO_GLOBAL_PREFIX__',
      `
      "use strict";

      function makeWorkerContent(url) {
        return '';
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
        try {
          // Try importing first to skip bundle loading when the bundle is already preloaded.
          return importAll();
        } catch (error) {
          var maybeLoadBundlePromise = maybeLoadBundle(moduleID, paths);
          if (maybeLoadBundlePromise != null) {
            return maybeLoadBundlePromise.then(importAll);
          }
          throw error;
        }
      }

      function asyncRequire(moduleID, paths, moduleName) {
        var ret = asyncRequireImpl(moduleID, paths, moduleName);
        if (!(ret instanceof Promise)) {
          return {
            _result: ret,
            then: function(resolve, reject) {
              return Promise.resolve(ret).then(resolve, reject);
            },
          };
        }
        return {
          _result: ret,
          then: function(resolve, reject) {
            return ret.then(resolve, reject);
          },
        };
      }

      asyncRequire.unstable_importMaybeSync = function(moduleID, paths) {
        return asyncRequireImpl(moduleID, paths);
      };

      asyncRequire.prefetch = function(moduleID, paths, moduleName) {
        var p = maybeLoadBundle(moduleID, paths);
        if (p) p.then(function(){}, function(){});
      };

      module.exports = asyncRequire;
      `
    );
    moduleFn(mockRequire, moduleObj, moduleObj.exports, '');
    asyncRequire = moduleObj.exports;
  });

  afterEach(() => {
    delete (globalThis as any).__loadBundleAsync;
    delete (globalThis as any).__METRO_GLOBAL_PREFIX__;
  });

  it('calls importAll with moduleID and moduleName when no bundle loading needed', async () => {
    const result = await asyncRequire(42, null, 'my-module');

    expect(mockImportAll).toHaveBeenCalledWith(42, 'my-module');
    expect(result).toEqual({ default: 'module-42' });
  });

  it('calls importAll without moduleName when not provided', async () => {
    const result = await asyncRequire(42, null);

    expect(mockImportAll).toHaveBeenCalledWith(42, undefined);
    expect(result).toEqual({ default: 'module-42' });
  });

  it('falls back to bundle load when importAll throws, then retries with moduleName', async () => {
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

  it('does not load the bundle when importAll succeeds (preloaded bundle case)', async () => {
    (globalThis as any).__loadBundleAsync = jest.fn(() => Promise.resolve());

    const paths = { '42': '/bundles/my-module.bundle' };
    const result = await asyncRequire(42, paths, 'my-module');

    expect(mockImportAll).toHaveBeenCalledWith(42, 'my-module');
    expect((globalThis as any).__loadBundleAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ default: 'module-42' });
  });

  it('re-throws the import error when no bundle path is configured', () => {
    mockImportAll.mockImplementationOnce(() => {
      throw new Error('Module not loaded');
    });

    expect(() => asyncRequire(42, null, 'my-module')).toThrow('Module not loaded');
  });

  describe('thenable return value', () => {
    it('exposes a synchronous _result when no bundle load was needed', () => {
      const ret = asyncRequire(42, null, 'my-module');

      expect(typeof ret.then).toBe('function');
      expect(ret._result).toEqual({ default: 'module-42' });
    });

    it('exposes a Promise _result when a bundle load was needed', async () => {
      mockImportAll
        .mockImplementationOnce(() => {
          throw new Error('Module not loaded');
        })
        .mockImplementationOnce(() => ({ default: 'module-42' }));

      (globalThis as any).__loadBundleAsync = jest.fn(() => Promise.resolve());

      const ret = asyncRequire(42, { '42': '/bundles/my-module.bundle' }, 'my-module');

      expect(typeof ret.then).toBe('function');
      expect(ret._result).toBeInstanceOf(Promise);
      await expect(ret._result).resolves.toEqual({ default: 'module-42' });
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
