import 'expo/build/Expo.fx';
import { activateKeepAwake } from 'expo-keep-awake';
import { AppRegistry, Platform } from 'react-native';
import withExpoRoot from './withExpoRoot';
if (__DEV__) {
    // TODO: Make this not a side-effect
    activateKeepAwake();
}
export default function registerRootComponent(component) {
    AppRegistry.registerComponent('main', () => withExpoRoot(component));
    if (Platform.OS === 'web') {
        const rootTag = document.getElementById('root') ?? document.getElementById('main');
        AppRegistry.runApplication('main', { rootTag });
    }
}
//# sourceMappingURL=registerRootComponent.js.map