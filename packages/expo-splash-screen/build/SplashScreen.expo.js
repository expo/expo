import { NativeModules } from 'react-native';
const { ExponentSplashScreen: SplashScreen = {} } = NativeModules;
export async function preventAutoHideAsync() {
    if (SplashScreen.preventAutoHide) {
        SplashScreen.preventAutoHide();
        return true;
    }
    return false;
}
export async function hideAsync() {
    if (SplashScreen.hide) {
        SplashScreen.hide();
        return true;
    }
    return false;
}
/**
 * @deprecated
 */
export function hide() {
    console.warn('SplashScreen.hide() is deprecated in favour of SplashScreen.hideAsync()');
    hideAsync();
}
/**
 * @deprecated
 */
export function preventAutoHide() {
    console.warn('SplashScreen.preventAutoHide() is deprecated in favour of SplashScreen.preventAutoHideAsync()');
    preventAutoHideAsync();
}
//# sourceMappingURL=SplashScreen.expo.js.map