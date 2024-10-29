import { AppRegistry, LogBox } from 'react-native';
import { enableScreens } from 'react-native-screens';

import { App } from './App';

// Hide this target from the JS inspector
globalThis.__expo_hide_from_inspector__ = 'expo-dev-launcher';

LogBox.ignoreLogs(['EventEmitter']);

enableScreens(false);

AppRegistry.registerComponent('main', () => App);
