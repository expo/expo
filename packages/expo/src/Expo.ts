import './Expo.fx';

export { disableErrorHandling } from './errors/ExpoErrorManager';
export { default as registerRootComponent } from './launch/registerRootComponent';

export { isRunningInExpoGo, getExpoGoProjectConfig } from './environment/ExpoGo';

export {
  // Core classes
  EventEmitter,
  SharedObject,
  SharedRef,
  NativeModule,

  // Methods
  requireNativeModule,
  requireOptionalNativeModule,
  requireNativeViewManager as requireNativeView,
  registerWebModule,
  reloadAppAsync,

  // Worklets
  installOnUIRuntime,
} from 'expo-modules-core';

export type {
  /** @deprecated Move to `SharedRef` with a type-only import instead */
  SharedRef as SharedRefType,
  /** @deprecated Move to `EventEmitter` with a type-only import instead */
  EventEmitter as EventEmitterType,
  /** @deprecated Move to `NativeModule` with a type-only import instead */
  NativeModule as NativeModuleType,
  /** @deprecated Move to `SharedObject` with a type-only import instead */
  SharedObject as SharedObjectType,
} from 'expo-modules-core/types';

export {
  PermissionStatus,
  type PermissionExpiration,
  type PermissionResponse,
  type PermissionHookOptions,
} from 'expo-modules-core';

export { createPermissionHook } from 'expo-modules-core';

export { useEvent, useEventListener } from './hooks/useEvent';
