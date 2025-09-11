import './sweet/setUpJsLogger.fx';
import './polyfill';

export type * from './ts-declarations/global';

export { EventEmitter, type EventSubscription } from './EventEmitter';
export { NativeModule } from './NativeModule';
export { SharedObject } from './SharedObject';
export { SharedRef } from './SharedRef';

export { default as Platform } from './Platform';
export { default as uuid } from './uuid';

export type { ProxyNativeModule } from './NativeModulesProxy.types';
export { requireNativeViewManager } from './NativeViewManagerAdapter';

export * from './requireNativeModule';
export * from './registerWebModule';
export * from './TypedArrays.types';

export * from './PermissionsInterface';
export * from './PermissionsHook';

export * from './Refs';

export * from './hooks/useReleasingSharedObject';
export * from './reload';

// Errors
export { CodedError } from './errors/CodedError';
export { UnavailabilityError } from './errors/UnavailabilityError';

// Deprecated
export { LegacyEventEmitter } from './LegacyEventEmitter';
export { default as NativeModulesProxy } from './NativeModulesProxy';
