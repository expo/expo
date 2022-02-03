import 'expo/build/Expo.fx';
import { AppRegistry, Platform } from 'react-native';
import withExpoRoot from './withExpoRoot';
export default function registerRootComponent(component) {
    AppRegistry.registerComponent('main', () => withExpoRoot(component));
    if (Platform.OS === 'web') {
        const rootTag = document.getElementById('root') ?? document.getElementById('main');
        AppRegistry.runApplication('main', { rootTag });
    }
}
//# sourceMappingURL=registerRootComponent.js.map