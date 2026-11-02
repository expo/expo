import type { FileStub } from '../testing-library/context-stubs';

/**
 * Like Metro's async require: `loadRoute` returns a thenable until `resolve()`, then the module.
 * With `native`, `loadRoute` keeps returning a thenable after the load, like async routes on native.
 */
export function lazyModule(module: object, { native = false } = {}) {
  let resolve!: (value: object) => void;
  let reject!: (error: Error) => void;
  const loading = new Promise<object>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  loading.catch(() => {});
  const load: Record<string, unknown> = {
    then: (onFulfilled?: (value: object) => unknown, onRejected?: (error: unknown) => unknown) =>
      loading.then(onFulfilled, onRejected),
  };
  // Jest renders routes synchronously, so the loaded exports must be readable on `load` itself.
  const settle = (exports: object) => {
    if (!native) {
      delete load.then;
    }
    Object.assign(load, exports);
  };
  return {
    // The thenable stands in for the module export object until it loads.
    load: load as FileStub,
    resolve() {
      settle(module);
      resolve(module);
    },
    reject(error: Error) {
      // A failed chunk throws into the layout's error boundary in an app; here it renders nothing.
      settle({ default: () => null });
      reject(error);
    },
  };
}
