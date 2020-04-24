import { Linking } from 'react-native';
import NativeLinking from 'react-native/Libraries/Linking/NativeLinking';
export default {
    addEventListener(type, handler) {
        // @ts-ignore: nativeEvent not supported
        Linking.addEventListener(type, handler);
    },
    removeEventListener(type, handler) {
        // @ts-ignore: nativeEvent not supported
        Linking.removeEventListener(type, handler);
    },
    canOpenURL: NativeLinking.canOpenURL,
    openSettings: NativeLinking.openSettings,
    getInitialURL: NativeLinking.getInitialURL,
    openURL: NativeLinking.openURL,
    sendIntent: Linking.sendIntent,
};
//# sourceMappingURL=ExpoLinking.js.map