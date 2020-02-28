import { EventEmitter } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import Platform from './Platform';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
// RCTDeviceEventEmitter pending https://github.com/necolas/react-native-web/pull/1402
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';
import { RCTDeviceEventEmitter } from './nativeEmitters';
export { RCTDeviceEventEmitter, EventEmitter, NativeModulesProxy, Platform, SyntheticPlatformEmitter, requireNativeViewManager, 
// Errors
CodedError, UnavailabilityError, };
//# sourceMappingURL=index.js.map