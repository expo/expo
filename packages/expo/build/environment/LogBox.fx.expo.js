import Constants from 'expo-constants';
import { YellowBox } from 'react-native';
if (__DEV__) {
    if (Constants.manifest?.experiments?.redesignedLogBox) {
        // @ts-ignore: This needs to be run before Expo.fx, and it's not included on external types
        YellowBox.__unstable_enableLogBox();
    }
    else {
        // Replace the YellowBox.__unstable_enableLogBox function to make discovery easier if
        // someone is following the React Native 62 blog post.
        // @ts-ignore
        YellowBox.__unstable_enableLogBox = () => console.warn('To enable the redesigned LogBox in your app, add "experiments": {"redesignedLogBox": true} to your app.json or app.config.js.');
    }
}
//# sourceMappingURL=LogBox.fx.expo.js.map