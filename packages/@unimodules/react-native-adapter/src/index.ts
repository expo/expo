import { Platform as ReactNativePlatform } from 'react-native';

import { EventEmitter, Subscription } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';

// RCTDeviceEventEmitter pending https://github.com/necolas/react-native-web/pull/1402
import { RCTDeviceEventEmitter } from './nativeEmitters';

import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';

export const Platform = {
  OS: ReactNativePlatform.OS,
};

export {
  RCTDeviceEventEmitter,
  EventEmitter,
  NativeModulesProxy,
  Subscription,
  SyntheticPlatformEmitter,
  requireNativeViewManager,

  CodedError,
  UnavailabilityError,
};
