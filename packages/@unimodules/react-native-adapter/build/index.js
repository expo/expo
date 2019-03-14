import { Platform as ReactNativePlatform } from 'react-native';
import { EventEmitter } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
export const Platform = {
    OS: ReactNativePlatform.OS,
};
export { EventEmitter, NativeModulesProxy, SyntheticPlatformEmitter, requireNativeViewManager, };
//# sourceMappingURL=index.js.map