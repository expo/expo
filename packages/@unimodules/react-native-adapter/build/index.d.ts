import { EventEmitter, Subscription } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
export declare const Platform: {
    OS: "ios" | "android" | "windows" | "macos" | "web";
};
export { EventEmitter, NativeModulesProxy, Subscription, SyntheticPlatformEmitter, requireNativeViewManager, };
