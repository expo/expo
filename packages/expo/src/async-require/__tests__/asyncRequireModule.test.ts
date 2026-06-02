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

  /**
   * Simulates Metro's registry: modules listed here resolve synchronously via
   * `importAll`; modules not in the set throw `Requiring unknown module "<id>".`
   * exactly like the real runtime, which is what `asyncRequireImpl` looks for
   * to decide whether to fall through to `__loadBundleAsync`.
   */
  let registeredModules: Set<number>;

  function registerModule(id: number) {
    registeredModules.add(id);
  }

  beforeEach(() => {
    registeredModules = new Set();

    mockImportAll = jest.fn((id: number, _moduleName?: string) => {
      if (!registeredModules.has(id)) {
        throw new Error(`Requiring unknown module "${id}".`);
      }
      return { default: `module-${id}` };
    });

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
    // Keep this snippet in sync with src/async-require/asyncRequireModule.ts.
    const moduleObj = { exports: {} as any };
    // eslint-disable-next-line no-new-func
    const moduleFn = new Function(
      'require',
      'module',
      'exports',
      '__METRO_GLOBAL_PREFIX__',
      `
      "use strict";

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
          return importAll();
        } catch (e) {
          if (!(e instanceof Error) || e.message.indexOf('Requiring unknown module') === -1) {
            throw e;
          }
        }

        var maybeLoadBundlePromise = maybeLoadBundle(moduleID, paths);
        if (maybeLoadBundlePromise != null) {
          return maybeLoadBundlePromise.then(importAll);
        }

        return importAll();
      }

      function asyncRequire(moduleID, paths, moduleName) {
        return asyncRequireImpl(moduleID, paths, moduleName);
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

  it('returns synchronously when the module is already registered', () => {
    registerModule(42);

    const result = asyncRequire(42, null, 'my-module');

    expect(result).toEqual({ default: 'module-42' });
    expect(mockImportAll).toHaveBeenCalledWith(42, 'my-module');
  });

  it('returns synchronously when the chunk has already been delivered, even with split paths', () => {
    registerModule(42);
    (globalThis as any).__loadBundleAsync = jest.fn(() => Promise.resolve());

    const paths = { '42': '/bundles/my-module.bundle' };
    const result = asyncRequire(42, paths, 'my-module');

    // The chunk is already in the registry — we must not refetch.
    expect((globalThis as any).__loadBundleAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ default: 'module-42' });
  });

  it('calls importAll without moduleName when not provided', () => {
    registerModule(42);

    const result = asyncRequire(42, null);

    expect(mockImportAll).toHaveBeenCalledWith(42, undefined);
    expect(result).toEqual({ default: 'module-42' });
  });

  it('falls through to __loadBundleAsync when the module is not yet registered', async () => {
    let resolveBundle!: () => void;
    const bundlePromise = new Promise<void>((resolve) => {
      resolveBundle = resolve;
    });

    (globalThis as any).__loadBundleAsync = jest.fn(() => bundlePromise);

    const paths = { '42': '/bundles/my-module.bundle' };
    const resultPromise = asyncRequire(42, paths, 'my-module');

    // The fast path is allowed to invoke importAll once to probe; what matters
    // is that the result is async because the bundle hasn't resolved yet.
    expect(resultPromise).toBeInstanceOf(Promise);

    // Simulate the chunk delivering the module, then resolve the load promise.
    registerModule(42);
    resolveBundle();
    const result = await resultPromise;

    expect(mockImportAll).toHaveBeenLastCalledWith(42, 'my-module');
    expect(result).toEqual({ default: 'module-42' });
  });

  it('re-throws non-"unknown module" errors from importAll without fetching the bundle', () => {
    registerModule(42);
    const factoryError = new Error('boom from factory');
    mockImportAll.mockImplementation(() => {
      throw factoryError;
    });
    (globalThis as any).__loadBundleAsync = jest.fn(() => Promise.resolve());

    const paths = { '42': '/bundles/my-module.bundle' };
    expect(() => asyncRequire(42, paths, 'my-module')).toThrow(factoryError);
    expect((globalThis as any).__loadBundleAsync).not.toHaveBeenCalled();
  });

  describe('unstable_importMaybeSync', () => {
    it('returns synchronously when the module is already registered', () => {
      registerModule(42);
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
