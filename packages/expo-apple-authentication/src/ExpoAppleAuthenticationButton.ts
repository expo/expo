import { requireNativeView } from 'expo';
import { Platform } from 'react-native';

let ExpoAppleAuthenticationButton: any;

if (Platform.OS === 'ios') {
  ExpoAppleAuthenticationButton = requireNativeView('ExpoAppleAuthentication');
}

export default ExpoAppleAuthenticationButton;
