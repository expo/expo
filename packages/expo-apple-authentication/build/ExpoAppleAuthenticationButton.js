import { requireNativeViewManager } from 'expo-modules-core';
import { Platform } from 'react-native';
let ExpoAppleAuthenticationButton;
if (Platform.OS === 'ios') {
    ExpoAppleAuthenticationButton = requireNativeViewManager('ExpoAppleAuthentication');
}
export default ExpoAppleAuthenticationButton;
//# sourceMappingURL=ExpoAppleAuthenticationButton.js.map