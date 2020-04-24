import { Linking } from 'react-native';
import NativeLinking from 'react-native/Libraries/Linking/NativeLinking';
export default {
    addEventListener: Linking.addEventListener,
    removeEventListener: Linking.removeEventListener,
    canOpenURL: NativeLinking.canOpenURL,
    openSettings: NativeLinking.openSettings,
    getInitialURL: NativeLinking.getInitialURL,
    openURL: NativeLinking.openURL,
    sendIntent: NativeLinking.sendIntent,
};
//# sourceMappingURL=ExpoLinking.js.map