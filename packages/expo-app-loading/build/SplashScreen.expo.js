import { NativeModules } from 'react-native';
const { ExponentSplashScreen: SplashScreen = {} } = NativeModules;
export function preventAutoHideAsync() {
    if (SplashScreen.preventAutoHide) {
        SplashScreen.preventAutoHide();
    }
}
export function hideAsync() {
    if (SplashScreen.hide) {
        SplashScreen.hide();
    }
}
//# sourceMappingURL=SplashScreen.expo.js.map