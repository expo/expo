import './Expo.fx';
export { disableErrorHandling } from './errors/ExpoErrorManager';
export { default as registerRootComponent } from './launch/registerRootComponent';
export { isRunningInExpoGo, getExpoGoProjectConfig } from './environment/ExpoGo';
export { EventEmitter, SharedObject, SharedRef, NativeModule, requireNativeModule, requireOptionalNativeModule, requireNativeViewManager as requireNativeView, registerWebModule, reloadAppAsync, } from 'expo-modules-core';
export type { 
/** @deprecated Move to `SharedRef` with a type-only import instead */
SharedRef as SharedRefType, 
/** @deprecated Move to `EventEmitter` with a type-only import instead */
EventEmitter as EventEmitterType, 
/** @deprecated Move to `NativeModule` with a type-only import instead */
NativeModule as NativeModuleType, 
/** @deprecated Move to `SharedObject` with a type-only import instead */
SharedObject as SharedObjectType, } from 'expo-modules-core/types';
export { useEvent, useEventListener } from './hooks/useEvent';
export { Color, type ColorType, type AndroidBaseColor, type AndroidBaseColorSDK1, type AndroidBaseColorSDK14, type AndroidBaseColorSDK31, type AndroidBaseColorSDK34, type AndroidBaseColorSDK35, type AndroidDeprecatedColor, type AndroidBaseColorAttr, type AndroidColorAttrSDK1, type AndroidColorAttrSDK5, type AndroidColorAttrSDK14, type AndroidColorAttrSDK21, type AndroidColorAttrSDK23, type AndroidColorAttrSDK25, type AndroidColorAttrSDK26, type IOSBaseColor, } from './color';
//# sourceMappingURL=Expo.d.ts.map