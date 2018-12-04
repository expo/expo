import { Platform as ReactNativePlatform } from 'react-native';

import { EventEmitter, Subscription } from './EventEmitter';
import NativeModulesProxy from './NativeModulesProxy';
import { requireNativeViewManager } from './NativeViewManagerAdapter';

export const Platform = {
  OS: ReactNativePlatform.OS
};

export { EventEmitter, NativeModulesProxy, Subscription, requireNativeViewManager };
