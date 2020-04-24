import { Linking } from 'react-native';
import NativeLinking from 'react-native/Libraries/Linking/NativeLinking';

import { URLListener } from './Linking.types';

export default {
  addEventListener(type: string, handler: URLListener) {
    // @ts-ignore: nativeEvent not supported
    Linking.addEventListener(type, handler);
  },
  removeEventListener(type: string, handler: URLListener) {
    // @ts-ignore: nativeEvent not supported
    Linking.removeEventListener(type, handler);
  },
  canOpenURL: NativeLinking.canOpenURL,
  openSettings: NativeLinking.openSettings,
  getInitialURL: NativeLinking.getInitialURL,
  openURL: NativeLinking.openURL,
  sendIntent: Linking.sendIntent,
};
