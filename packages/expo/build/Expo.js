import './Expo.fx';
export { disableErrorHandling } from './errors/ExpoErrorManager';
export { default as registerRootComponent } from './launch/registerRootComponent';
export { isRunningInExpoGo, getExpoGoProjectConfig } from './environment/ExpoGo';
export { 
// Core classes
EventEmitter, SharedObject, NativeModule, 
// Methods
requireNativeModule, requireOptionalNativeModule, reloadAppAsync, } from 'expo-modules-core';
//# sourceMappingURL=Expo.js.map