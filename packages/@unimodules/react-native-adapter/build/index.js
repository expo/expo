import { DeviceEventEmitter } from 'react-native';
import { EventEmitter } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import Platform from './Platform';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';
export { DeviceEventEmitter, EventEmitter, NativeModulesProxy, Platform, SyntheticPlatformEmitter, requireNativeViewManager, 
// Errors
CodedError, UnavailabilityError, };
/**
 * @deprecated renamed to `DeviceEventEmitter`
 */
export const RCTDeviceEventEmitter = DeviceEventEmitter;
//# sourceMappingURL=index.js.map