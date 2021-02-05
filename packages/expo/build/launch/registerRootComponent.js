import 'expo/build/Expo.fx';
import { activateKeepAwake } from 'expo-keep-awake';
import { AppRegistry } from 'react-native';
import withExpoRoot from './withExpoRoot';
if (__DEV__) {
    activateKeepAwake();
}
export default function registerRootComponent(component) {
    AppRegistry.registerComponent('main', () => withExpoRoot(component));
}
//# sourceMappingURL=registerRootComponent.js.map