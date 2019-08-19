import { requireNativeViewManager } from '@unimodules/core';
import { Platform } from 'react-native';
let ExpoWalletAddPassButton = null;
if (Platform.OS === 'ios') {
    ExpoWalletAddPassButton = requireNativeViewManager('ExpoWalletAddPassButton');
}
export default ExpoWalletAddPassButton;
//# sourceMappingURL=ExpoWalletAddPassButton.js.map