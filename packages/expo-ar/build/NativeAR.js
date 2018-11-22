import { EventEmitter, NativeModulesProxy } from 'expo-core';
/**
 * Native module proxy.
 * Holds references to all natively implemented function.
 */
export const NativeAR = NativeModulesProxy.ExpoAR;
/**
 * Native module events emitter
 */
export const NativeAREventEmitter = new EventEmitter(NativeAR);
//# sourceMappingURL=NativeAR.js.map