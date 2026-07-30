import { requireNativeView } from 'expo';
import { Platform } from 'react-native';

let ExpoClipboard: any;

if (Platform.OS === 'ios') {
  ExpoClipboard = requireNativeView('ExpoClipboard');
}

export default ExpoClipboard;
