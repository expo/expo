import { EventEmitter, Subscription } from './EventEmitter';
import NativeModulesProxy, { ProxyNativeModule } from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import Platform from './Platform';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';

// RCTDeviceEventEmitter pending https://github.com/necolas/react-native-web/pull/1402
import { RCTDeviceEventEmitter } from './nativeEmitters';

import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';

export {
  RCTDeviceEventEmitter,
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
