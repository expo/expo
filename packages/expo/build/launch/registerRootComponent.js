import 'expo/build/Expo.fx';
import { AppRegistry } from 'react-native';
import withExpoRoot from './withExpoRoot';
export default function registerRootComponent(component) {
    AppRegistry.registerComponent('main', () => withExpoRoot(component));
}
//# sourceMappingURL=registerRootComponent.js.map