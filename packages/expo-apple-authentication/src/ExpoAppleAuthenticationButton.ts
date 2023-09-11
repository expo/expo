import { requireNativeViewManager } from 'expo-modules-core';
import { Platform } from 'react-native';

let ExpoAppleAuthenticationButton: any;

if (Platform.OS === 'ios') {
  ExpoAppleAuthenticationButton = requireNativeViewManager('ExpoAppleAuthentication');
}

export default ExpoAppleAuthenticationButton;
