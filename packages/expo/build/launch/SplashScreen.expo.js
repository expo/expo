import { NativeModules } from 'react-native';
const { ExponentSplashScreen: SplashScreen = {} } = NativeModules;
export function preventAutoHide() {
    if (SplashScreen.preventAutoHide) {
        SplashScreen.preventAutoHide();
    }
}
export function hide() {
    if (SplashScreen.hide) {
        SplashScreen.hide();
    }
}
//# sourceMappingURL=SplashScreen.expo.js.map