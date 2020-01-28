import { NativeModules, Platform } from 'react-native';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';
const NativeProxy = NativeModules.NativeUnimoduleProxy;
const modulesConstantsKey = 'modulesConstants';
const exportedMethodsKey = 'exportedMethods';
const NativeModulesProxy = {};
if (!NativeProxy) {
    console.warn(`The "UMNativeModulesProxy" native module is not exported through NativeModules; verify that @unimodules/react-native-adapter's native code is linked properly`);
}
function createModuleProxy(moduleName) {
    const moduleProxy = NativeProxy[modulesConstantsKey][moduleName] ?? {};
    NativeProxy[exportedMethodsKey][moduleName].forEach(methodInfo => {
        moduleProxy[methodInfo.name] = (...args) => {
            const { key, argumentsCount } = methodInfo;
            if (argumentsCount !== args.length) {
                return Promise.reject(new Error(`Native method ${moduleName}.${methodInfo.name} expects ${argumentsCount} ${argumentsCount === 1 ? 'argument' : 'arguments'} but received ${args.length}`));
            }
            return NativeProxy.callMethod(moduleName, key, args);
        };
    });
    // These are called by EventEmitter (which is a wrapper for NativeEventEmitter)
    // only on iOS and they use iOS-specific native module, EXReactNativeEventEmitter.
    //
    // On Android only {start,stop}Observing are called on the native module
    // and these should be exported as Expo methods.
    moduleProxy.addListener = (...args) => NativeModules.UMReactNativeEventEmitter.addProxiedListener(moduleName, ...args);
    moduleProxy.removeListeners = (...args) => NativeModules.UMReactNativeEventEmitter.removeProxiedListeners(moduleName, ...args);
    return new Proxy(moduleProxy, {
        get: (target, propName, receiver) => {
            if (propName in target || propName === '$$typeof') {
                return Reflect.get(target, propName, receiver);
            }
            throw new UnavailabilityError(moduleName, String(propName));
        },
    });
}
export default new Proxy(NativeModulesProxy, {
    get: (target, propName, receiver) => {
        if (propName in target || propName === '$$typeof') {
            return Reflect.get(target, propName, receiver);
        }
        const moduleName = String(propName);
        if (NativeProxy[exportedMethodsKey][moduleName]) {
            const moduleProxy = createModuleProxy(String(propName));
            target[String(propName)] = moduleProxy;
            return moduleProxy;
        }
        throw new CodedError('ERR_UNAVAILABLE', `Native module ${String(propName)} is not available on ${Platform.OS}; are you sure you've linked all the native dependencies properly?`);
    },
    ownKeys: target => {
        return Array.from(new Set([...Reflect.ownKeys(target), ...Object.keys(NativeProxy[exportedMethodsKey])]));
    },
});
//# sourceMappingURL=NativeModulesProxy.js.map