import { DeviceEventEmitter } from 'react-native';
import { EventEmitter, Subscription } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { ProxyNativeModule } from './NativeModulesProxy.types';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import Platform from './Platform';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';
import './sweet/setUpErrorManager.fx';
export { default as deprecate } from './deprecate';
export { DeviceEventEmitter, EventEmitter, NativeModulesProxy, ProxyNativeModule, Platform, Subscription, SyntheticPlatformEmitter, requireNativeViewManager, CodedError, UnavailabilityError, };
export * from './requireNativeModule';
export * from './TypedArrays.types';
/**
 * @deprecated renamed to `DeviceEventEmitter`
 */
export declare const RCTDeviceEventEmitter: import("react-native").DeviceEventEmitterStatic;
export * from './PermissionsInterface';
export * from './PermissionsHook';
//# sourceMappingURL=index.d.ts.map