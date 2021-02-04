import 'expo/build/Expo.fx';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AppRegistry } from 'react-native';
if (__DEV__) {
    // In dev mode, attempt to keep the screen on.
    try {
        const { activateKeepAwake } = require('expo-keep-awake');
        activateKeepAwake();
    }
    catch {
        // expo-keep-awake may not be installed in all projects.
    }
}
const isExpo = Constants.executionEnvironment === ExecutionEnvironment.Standalone || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export default function registerRootComponent(component) {
    if (isExpo) {
        try {
            const withExpoRoot = require('./withExpoRoot');
            AppRegistry.registerComponent('main', () => withExpoRoot(component));
        }
        catch (error) {
            if (isExpo)
                throw error;
        }
    }
    else {
        AppRegistry.registerComponent('main', () => component);
    }
}
//# sourceMappingURL=registerRootComponent.js.map