import { ExecutionEnvironment } from 'expo-constants';
const PROPS_TO_IGNORE = [
    /**
     * We don't want to throw when the expo or expo-modules-core packages try to access any of these
     * modules, since they have built-in fallbacks.
     */
    'DevLoadingView',
    'EXDevLauncher',
    'EXReactNativeEventEmitter',
    'NativeUnimoduleProxy',
    /**
     * Other methods that can be called on the NativeModules object that we should ignore. The
     * underlying NativeModules object is sometimes a proxy itself so may not have these methods
     * defined.
     */
    'hasOwnProperty',
    'isPrototypeOf',
    'toJSON',
    'toLocaleString',
    'toString',
    'valueOf',
    '$$typeof',
];
const hasWarnedForModule = [];
let additionalModulesToIgnore = [];
let enabled = true;
function createErrorMessageForStoreClient(moduleName) {
    return `Your JavaScript code tried to access a native module, ${moduleName}, that isn't supported in Expo Go.
To continue development with ${moduleName}, you need to create a development build of your app. See https://docs.expo.dev/development/introduction/ for more info.`;
}
function createErrorMessageForDevelopmentBuild(moduleName) {
    return `Your JavaScript code tried to access a native module, ${moduleName}, that doesn't exist in this development build.
Make sure you are using the newest available development build of this app and running a compatible version of your JavaScript code. If you've installed a new library recently, you may need to make a new development build.`;
}
export function createProxyForNativeModules(NativeModules) {
    if (!__DEV__) {
        return NativeModules;
    }
    return new Proxy(NativeModules, {
        get(target, prop) {
            const value = target[prop];
            if (enabled &&
                (value === null || value === undefined) &&
                !PROPS_TO_IGNORE.includes(prop.toString()) &&
                !additionalModulesToIgnore.includes(prop.toString()) &&
                // only want to throw once per module
                !hasWarnedForModule.includes(prop.toString())) {
                hasWarnedForModule.push(prop.toString());
                const isRunningInStoreClient = global.ExpoModules?.NativeModulesProxy?.modulesConstants?.ExponentConstants
                    ?.executionEnvironment === ExecutionEnvironment.StoreClient ||
                    target.NativeUnimoduleProxy?.modulesConstants?.ExponentConstants?.executionEnvironment ===
                        ExecutionEnvironment.StoreClient;
                if (isRunningInStoreClient) {
                    throw new Error(createErrorMessageForStoreClient(prop.toString()));
                }
                else if (target.EXDevLauncher) {
                    throw new Error(createErrorMessageForDevelopmentBuild(prop.toString()));
                }
            }
            return value;
        },
    });
}
export function disableMissingNativeModuleErrors(moduleNames) {
    if (moduleNames) {
        additionalModulesToIgnore = typeof moduleNames === 'string' ? [moduleNames] : moduleNames;
        enabled = true;
    }
    else {
        enabled = false;
    }
}
//# sourceMappingURL=NativeModules.js.map