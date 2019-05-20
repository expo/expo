import { EventEmitter, Subscription } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
export declare const Platform: {
    OS: import("react-native").PlatformOSType;
};
export { EventEmitter, NativeModulesProxy, Subscription, SyntheticPlatformEmitter, requireNativeViewManager, };
