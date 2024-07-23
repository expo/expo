import { requireNativeViewManager } from 'expo';
import { Platform } from 'react-native';

let ExpoClipboard: any;

if (Platform.OS === 'ios') {
  ExpoClipboard = requireNativeViewManager('ExpoClipboard');
}

export default ExpoClipboard;
