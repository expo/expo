import { NativeModules } from 'react-native';
const { ExponentSplashScreen: SplashScreen = {} } = NativeModules;
export function preventAutoHideAsync() {
    if (SplashScreen.preventAutoHideAsync) {
        SplashScreen.preventAutoHideAsync();
    }
}
export function hideAsync() {
    if (SplashScreen.hideAsync) {
        SplashScreen.hideAsync();
    }
}
//# sourceMappingURL=SplashScreen.expo.js.map