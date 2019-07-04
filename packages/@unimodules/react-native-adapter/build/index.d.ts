import { EventEmitter, Subscription } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';
export declare const Platform: {
    OS: import("react-native").PlatformOSType;
};
export { EventEmitter, NativeModulesProxy, Subscription, SyntheticPlatformEmitter, requireNativeViewManager, CodedError, UnavailabilityError, };
