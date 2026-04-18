// @ts-expect-error: TODO(@kitten): Define this type (seems to differ from react-native)
import { AppRegistry } from 'react-native-web';
const APP_KEY = 'App';
export function registerStaticRootComponent(component, initialProps) {
    AppRegistry.registerComponent(APP_KEY, () => component);
    return AppRegistry.getApplication(APP_KEY, { initialProps });
}
//# sourceMappingURL=registerRootComponent.js.map