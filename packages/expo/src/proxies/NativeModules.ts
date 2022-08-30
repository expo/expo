import { ExecutionEnvironment } from 'expo-constants';

const PROPS_TO_IGNORE: Set<string> = new Set([
  /**
   * We don't want to throw when the expo or expo-modules-core packages try to access any of these
   * modules, since they have built-in fallbacks.
   */
  'DevLoadingView',
  'EXDevLauncher',
  'EXReactNativeEventEmitter',
  'NativeUnimoduleProxy',
  /**
   * Other modules that are accessed via packages in the Expo SDK but have built-in fallbacks
   */
  'ExpoImageModule',
  'PlatformLocalStorage',
  'RNC_AsyncSQLiteDBStorage',
  'RNCAsyncStorage',
  'RNGetRandomValues',
  'RNVectorIconsManager',
  'RNVectorIconsModule',
  /**
   * Other methods that can be called on the NativeModules object that we should ignore. The
   * underlying NativeModules object is sometimes a proxy itself so may not have these methods
   * defined.
   */
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toJSON',
  'toLocaleString',
  'toString',
  'valueOf',
  '$$typeof',
]);
const alreadyErroredModules: Set<string> = new Set();

let additionalModulesToIgnore: Set<string> = new Set();
let enabled = true;

function createErrorMessageForStoreClient(moduleName: string) {
  return `Your JavaScript code tried to access a native module, ${moduleName}, that isn't supported in Expo Go.
To continue development with ${moduleName}, you need to create a development build of your app. See https://expo.fyi/missing-native-module for more info, including how to disable these errors.`;
}

function createErrorMessageForDevelopmentBuild(moduleName: string) {
  return `Your JavaScript code tried to access a native module, ${moduleName}, that doesn't exist in this development build.
Make sure you are using the newest available development build of this app and running a compatible version of your JavaScript code. If you've installed a new library recently, you may need to make a new development build.
See https://expo.fyi/missing-native-module for more info, including how to disable these errors.`;
}

export function createProxyForNativeModules(NativeModules: any) {
  if (!__DEV__) {
    return NativeModules;
  }
  return new Proxy(NativeModules, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (
        enabled &&
        typeof prop !== 'symbol' &&
        (value === null || value === undefined) &&
        !PROPS_TO_IGNORE.has(prop) &&
        !additionalModulesToIgnore.has(prop) &&
        !alreadyErroredModules.has(prop)
      ) {
        alreadyErroredModules.add(prop);

        const isRunningInStoreClient =
          global.ExpoModules?.NativeModulesProxy?.modulesConstants.ExponentConstants
            ?.executionEnvironment === ExecutionEnvironment.StoreClient ||
          target.NativeUnimoduleProxy?.modulesConstants.ExponentConstants?.executionEnvironment ===
            ExecutionEnvironment.StoreClient;
        if (isRunningInStoreClient) {
          throw new Error(createErrorMessageForStoreClient(prop));
        } else if (target.EXDevLauncher) {
          throw new Error(createErrorMessageForDevelopmentBuild(prop));
        }
      }
      return value;
    },
  });
}

/**
 * Disable the error thrown when trying to access a native module that doesn't exist in the host
 * runtime. If a module name or array of module names is provided, this method disables the error
 * for only those modules, erasing a previous setting if one exists. If no parameter is provided,
 * this method disables the error for all modules.
 *
 * @param moduleNames Name of module or modules for which to disable the missing native module
 * error. If this parameter is omitted, the error will be disabled globally.
 */
export function disableMissingNativeModuleErrors(moduleNames?: string[] | string) {
  if (moduleNames) {
    additionalModulesToIgnore =
      typeof moduleNames === 'string' ? new Set([moduleNames]) : new Set(moduleNames);
    enabled = true;
  } else {
    enabled = false;
  }
}
