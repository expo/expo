import { DeviceEventEmitter } from 'react-native';
import { EventEmitter } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import Platform from './Platform';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';
import './sweet/setUpErrorManager.fx';
import './web/index';
export { default as uuid } from './uuid';
export { DeviceEventEmitter, EventEmitter, NativeModulesProxy, Platform, requireNativeViewManager, 
// Errors
CodedError, UnavailabilityError, };
export * from './requireNativeModule';
export * from './TypedArrays.types';
/**
 * @deprecated renamed to `DeviceEventEmitter`
 */
export const SyntheticPlatformEmitter = DeviceEventEmitter;
export * from './PermissionsInterface';
export * from './PermissionsHook';
export * from './Refs';
export * from './hooks/useReleasingSharedObject';
//# sourceMappingURL=index.js.map