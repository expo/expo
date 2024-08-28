import NativeModulesProxy from './NativeModulesProxy';
import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';

function proxyModule(m) {
  return new Proxy(m, {
    get(target, propKey) {
      const origMethod = target[propKey];
      if (typeof origMethod !== 'function') return origMethod;

      return (...args) => {
        const start = performance.now();
        const result = origMethod.apply(this, args);
        const end = performance.now();
        if (result instanceof Promise) {
          return new Promise((resolve, reject) => {
            result
              .then((data) => {
                const promiseEnd = performance.now();
                (globalThis?.expo as any)?.registerBenchmark(
                  propKey.toString(),
                  promiseEnd - start
                );
                resolve(data);
              })
              .catch(reject);
          });
        } else {
          (globalThis?.expo as any)?.registerBenchmark(propKey.toString(), end - start);
          return result;
        }
      };
    },
  });
}

/**
 * Imports the native module registered with given name. In the first place it tries to load
 * the module installed through the JSI host object and then falls back to the bridge proxy module.
 * Notice that the modules loaded from the proxy may not support some features like synchronous functions.
 *
 * @param moduleName Name of the requested native module.
 * @returns Object representing the native module.
 * @throws Error when there is no native module with given name.
 */
export function requireNativeModule<ModuleType = any>(moduleName: string): ModuleType {
  const nativeModule = requireOptionalNativeModule<ModuleType>(moduleName);

  if (!nativeModule) {
    throw new Error(`Cannot find native module '${moduleName}'`);
  }
  return nativeModule;
}

/**
 * Imports the native module registered with the given name. The same as `requireNativeModule`,
 * but returns `null` when the module cannot be found instead of throwing an error.
 *
 * @param moduleName Name of the requested native module.
 * @returns Object representing the native module or `null` when it cannot be found.
 */
export function requireOptionalNativeModule<ModuleType = any>(
  moduleName: string
): ModuleType | null {
  ensureNativeModulesAreInstalled();
  const mod = globalThis.expo?.modules?.[moduleName];
  return (mod && proxyModule(mod)) ?? NativeModulesProxy[moduleName] ?? null;
}
