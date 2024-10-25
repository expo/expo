import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';

import { App } from './App';

// Hide this target from the JS inspector
globalThis.__expo_hide_from_inspector__ = 'expo-dev-menu';

enableScreens(false);

AppRegistry.registerComponent('main', () => App);
