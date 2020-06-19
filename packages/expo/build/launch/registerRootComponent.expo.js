import Constants from 'expo-constants';
import { activateKeepAwake } from 'expo-keep-awake';
import { AppRegistry, YellowBox } from 'react-native';
import withExpoRoot from './withExpoRoot';
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
    activateKeepAwake();
}
// Require side-effects
require('expo/build/Expo.fx');
export default function registerRootComponent(component) {
    AppRegistry.registerComponent('main', () => withExpoRoot(component));
}
//# sourceMappingURL=registerRootComponent.expo.js.map