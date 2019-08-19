import { requireNativeViewManager } from '@unimodules/core';
import { Platform } from 'react-native';

let ExpoWalletAddPassButton: any = null;

if (Platform.OS === 'ios') {
  ExpoWalletAddPassButton = requireNativeViewManager('ExpoWalletAddPassButton');
}

export default ExpoWalletAddPassButton;
