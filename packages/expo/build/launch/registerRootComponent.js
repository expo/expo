import 'expo/build/Expo.fx';
import { AppRegistry, Platform } from 'react-native';
export default function registerRootComponent(component) {
    if (process.env.NODE_ENV === 'production') {
        AppRegistry.registerComponent('main', () => component);
    }
    else {
        const { withDevTools } = require('./withDevTools');
        AppRegistry.registerComponent('main', () => withDevTools(component));
    }
    if (Platform.OS === 'web') {
        const rootTag = document.getElementById('root') ?? document.getElementById('main');
        AppRegistry.runApplication('main', { rootTag });
    }
}
//# sourceMappingURL=registerRootComponent.js.map