import 'expo/build/Expo.fx';
import { AppRegistry, Platform } from 'react-native';
import withRestoration from './withRestoration';
export default function registerRootComponent(component) {
    AppRegistry.registerComponent('main', () => withRestoration(component));
    if (Platform.OS === 'web') {
        const rootTag = document.getElementById('root') ?? document.getElementById('main');
        AppRegistry.runApplication('main', { rootTag });
    }
}
//# sourceMappingURL=registerRootComponent.js.map