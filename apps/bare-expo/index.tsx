import registerRootComponent from 'expo/build/launch/registerRootComponent';

import App from './App';
import { debugLoadedModules } from './debugging';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in the Expo client or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

if (__DEV__) {
    debugLoadedModules({
        appName: require('./package.json').name,
        moduleImportPatterns: ['node_modules', 'react-native-lab', '../packages']
    })
}