import { DeviceEventEmitter } from 'react-native';
import { EventEmitter } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import Platform from './Platform';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';
import './sweet/setUpErrorManager.fx';
export { default as deprecate } from './deprecate';
export { DeviceEventEmitter, EventEmitter, NativeModulesProxy, Platform, SyntheticPlatformEmitter, requireNativeViewManager, 
// Errors
CodedError, UnavailabilityError, };
export * from './requireNativeModule';
/**
 * @deprecated renamed to `DeviceEventEmitter`
 */
export const RCTDeviceEventEmitter = DeviceEventEmitter;
export * from './PermissionsInterface';
export * from './PermissionsHook';
//# sourceMappingURL=index.js.map