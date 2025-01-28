import './Expo.fx';
export { disableErrorHandling } from './errors/ExpoErrorManager';
export { default as registerRootComponent } from './launch/registerRootComponent';
export { isRunningInExpoGo, getExpoGoProjectConfig } from './environment/ExpoGo';
export { EventEmitter, SharedObject, SharedRef, NativeModule, requireNativeModule, requireOptionalNativeModule, requireNativeViewManager as requireNativeView, registerWebModule, reloadAppAsync, } from 'expo-modules-core';
export { useEvent, useEventListener } from './hooks/useEvent';
//# sourceMappingURL=Expo.d.ts.map