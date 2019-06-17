import { Platform as ReactNativePlatform } from 'react-native';
import { EventEmitter } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import SyntheticPlatformEmitter from './SyntheticPlatformEmitter';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';
export const Platform = {
    OS: ReactNativePlatform.OS,
};
export { EventEmitter, NativeModulesProxy, SyntheticPlatformEmitter, requireNativeViewManager, CodedError, UnavailabilityError, };
//# sourceMappingURL=index.js.map