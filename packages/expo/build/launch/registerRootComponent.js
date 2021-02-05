import 'expo/build/Expo.fx';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AppRegistry } from 'react-native';
const isLegacyManagedWorkflow = Constants.executionEnvironment === ExecutionEnvironment.Standalone || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
if (__DEV__) {
    // In dev mode, attempt to keep the screen on.
    try {
        const { activateKeepAwake } = require('expo-keep-awake');
        activateKeepAwake();
    }
    catch (error) {
        if (isLegacyManagedWorkflow) {
            throw error;
        }
        // expo-keep-awake may not be installed in all projects.
    }
}
export default function registerRootComponent(component) {
    // TODO: Is this right? Are there cases when notifications shouldn't be passed to the app as initial props?
    // if (isLegacyManagedWorkflow) {
    try {
        const withExpoRoot = require('./withExpoRoot');
        AppRegistry.registerComponent('main', () => withExpoRoot(component));
    }
    catch (error) {
        if (isLegacyManagedWorkflow)
            throw error;
    }
    // } else {
    //   AppRegistry.registerComponent('main', () => component);
    // }
}
//# sourceMappingURL=registerRootComponent.js.map