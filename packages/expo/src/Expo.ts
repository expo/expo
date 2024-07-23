import './Expo.fx';

export { disableErrorHandling } from './errors/ExpoErrorManager';
export { default as registerRootComponent } from './launch/registerRootComponent';

export { isRunningInExpoGo, getExpoGoProjectConfig } from './environment/ExpoGo';

export {
  // Core classes
  EventEmitter,
  type EventSubscription,
  SharedObject,
  SharedRef,
  NativeModule,

  // Methods
  requireNativeModule,
  requireOptionalNativeModule,
  requireNativeViewManager,
  reloadAppAsync,

  // Constants
  Platform,

  // Hooks
  useReleasingSharedObject,
} from 'expo-modules-core';

export { useEvent } from './hooks/useEvent';
