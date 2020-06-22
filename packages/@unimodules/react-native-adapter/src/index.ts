import { DeviceEventEmitter } from 'react-native';

import { EventEmitter, Subscription } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { ProxyNativeModule } from './NativeModulesProxy.types';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import Platform from './Platform';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';

export {
  DeviceEventEmitter,
  EventEmitter,
  NativeModulesProxy,
  ProxyNativeModule,
  Platform,
  Subscription,
  SyntheticPlatformEmitter,
  requireNativeViewManager,
  // Errors
  CodedError,
  UnavailabilityError,
};

/**
 * @deprecated renamed to `DeviceEventEmitter`
 */
export const RCTDeviceEventEmitter = DeviceEventEmitter;
