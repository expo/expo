import { EventEmitter, Subscription } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
import { RCTEventEmitter, RCTDeviceEventEmitter } from './nativeEmitters';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';
export declare const Platform: {
    OS: "ios" | "android" | "windows" | "macos" | "web";
};
export { RCTEventEmitter, RCTDeviceEventEmitter, EventEmitter, NativeModulesProxy, Subscription, SyntheticPlatformEmitter, requireNativeViewManager, CodedError, UnavailabilityError, };
